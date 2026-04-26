import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.6'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 1. Obter data de hoje no formato MM-DD (considerando fuso de Brasília UTC-3 se necessário, ou apenas UTC)
    // Para simplificar e bater com o banco que geralmente armazena Date puro, vamos usar a data local do servidor
    const now = new Date()
    const today = now.toISOString().slice(5, 10) // "MM-DD"
    
    console.log(`Verificando aniversariantes para: ${today}`)

    // 2. Buscar aniversariantes de hoje
    // Como birth_date é DATE, podemos usar cast para string ou extração de partes
    const { data: birthdayPeople, error: usersError } = await supabase
      .from('users')
      .select('full_name, birth_date')
      .not('birth_date', 'is', null)

    if (usersError) throw usersError

    const luckyOnes = birthdayPeople?.filter(p => p.birth_date.slice(5, 10) === today) || []

    if (luckyOnes.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhum aniversariante hoje.' }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    }

    // 3. Preparar mensagem
    const names = luckyOnes.map(p => p.full_name).join(', ')
    const title = "🎉 Aniversariante do Dia!"
    const body = luckyOnes.length === 1 
      ? `Hoje é o aniversário de ${names}! Vamos dar os parabéns no grupo? 🎂`
      : `Hoje é o aniversário de ${names}! Parabéns a todos! 🎂`

    // 4. Buscar subscrições de push
    const { data: subs, error: subsError } = await supabase
      .from('push_subscriptions')
      .select('subscription')

    if (subsError) throw subsError

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ message: 'Nenhuma subscrição de push encontrada.' }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    }

    // 5. Configurar Web Push
    webpush.setVapidDetails(
      'mailto:contato@liturgiasje.com.br',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    )

    // 6. Enviar notificações em paralelo
    console.log(`Enviando notificações para ${subs.length} dispositivos...`)
    
    const pushResults = await Promise.all(
      subs.map(s => 
        webpush.sendNotification(
          s.subscription, 
          JSON.stringify({ 
            title, 
            body, 
            url: '/' 
          })
        ).catch(err => {
          // Se a subscrição falhar (ex: expirou), idealmente deveríamos remover do banco
          // Mas por agora apenas logamos o erro
          console.error('Falha ao enviar para uma subscrição:', err.statusCode)
          return null
        })
      )
    )

    return new Response(JSON.stringify({ 
      success: true, 
      aniversariantes: luckyOnes.map(p => p.full_name),
      enviado_para: pushResults.filter(r => r !== null).length
    }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error: any) {
    console.error('Erro na Edge Function:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
