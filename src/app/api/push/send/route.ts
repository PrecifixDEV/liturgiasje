import { createClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/push';

export async function POST(request: Request) {
  try {
    const { title, body, url, targetUserIds } = await request.json();
    
    // Autenticação básica ou chave de API interna opcional para segurança extra
    const supabase = await createClient();
    const { data: { user: sender } } = await supabase.auth.getUser();

    // Apenas admins podem disparar notificações genéricas por aqui
    const { data: senderProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', sender?.id)
      .single();

    if (senderProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Buscar subscrições
    let query = supabase.from('push_subscriptions').select('subscription, user_id');
    
    if (targetUserIds && targetUserIds.length > 0) {
      query = query.in('user_id', targetUserIds);
    }

    const { data: subs, error: subsError } = await query;

    if (subsError) {
      return NextResponse.json({ error: subsError.message }, { status: 500 });
    }

    const results = await Promise.all(
      (subs || []).map(async (sub: any) => {
        const result = await sendPushNotification(sub.subscription, { title, body, url });
        
        // Se a subscrição expirou, remove do banco
        if (result.error === 'expired') {
          await supabase
            .from('push_subscriptions')
            .delete()
            .match({ user_id: sub.user_id, subscription: sub.subscription });
        }
        
        return result;
      })
    );

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({ 
      success: true, 
      sentCount: successCount, 
      totalItems: results.length 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
