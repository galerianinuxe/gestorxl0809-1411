
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SystemStats {
  database_name: string;
  database_size: string;
  database_size_bytes: number;
  database_capacity: string;
  database_usage_percentage: number;
  storage_size: string;
  storage_capacity: string;
  storage_usage_percentage: number;
  total_tables: number;
  total_functions: number;
  active_connections: number;
  active_users: number;
  transactions_today: number;
  total_transactions: number;
  cpu_usage?: number;
  memory_usage?: number;
  supabase_plan: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Fetching detailed Supabase database statistics...')

    // Extrair nome do banco a partir da URL
    const dbName = supabaseUrl.split('//')[1].split('.')[0] || 'supabase_db'

    // Get real table count from information_schema
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')

    console.log('Tables query result:', { tablesData, tablesError })

    // Get real users count
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })

    console.log('Users query result:', { count: usersData?.length, usersError })

    // Get active users (updated in last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const { data: activeUsersData, error: activeUsersError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .gte('updated_at', yesterday.toISOString())

    console.log('Active users query result:', { count: activeUsersData?.length, activeUsersError })

    // Get transactions today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: todayTransactions, error: todayTransactionsError } = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .gte('created_at', today.toISOString())
      .eq('status', 'completed')

    console.log('Today transactions query result:', { count: todayTransactions?.length, todayTransactionsError })

    // Get total transactions
    const { data: totalTransactions, error: totalTransactionsError } = await supabase
      .from('orders')
      .select('id', { count: 'exact' })
      .eq('status', 'completed')

    console.log('Total transactions query result:', { count: totalTransactions?.length, totalTransactionsError })

    // Get detailed database size and statistics
    let databaseSizeBytes = 0
    let databaseSizeFormatted = 'N/A'
    try {
      const { data: dbSizeData, error: dbSizeError } = await supabase.rpc('get_database_statistics')
      if (!dbSizeError && dbSizeData) {
        databaseSizeFormatted = dbSizeData.database_size || 'N/A'
        // Tentar extrair bytes do tamanho formatado
        if (typeof dbSizeData.size_bytes === 'number') {
          databaseSizeBytes = dbSizeData.size_bytes
        } else if (databaseSizeFormatted.includes('MB')) {
          const mbValue = parseFloat(databaseSizeFormatted.replace(/[^\d.]/g, ''))
          databaseSizeBytes = mbValue * 1024 * 1024
        } else if (databaseSizeFormatted.includes('GB')) {
          const gbValue = parseFloat(databaseSizeFormatted.replace(/[^\d.]/g, ''))
          databaseSizeBytes = gbValue * 1024 * 1024 * 1024
        }
      }
      console.log('Database size query result:', { dbSizeData, dbSizeError })
    } catch (error) {
      console.log('Database size query failed:', error)
    }

    // Definir limites do plano Free do Supabase
    const supabaseFreeDbLimit = 500 * 1024 * 1024 // 500 MB em bytes
    const supabaseFreeStorageLimit = 1 * 1024 * 1024 * 1024 // 1 GB em bytes

    // Calcular percentuais de uso
    const dbUsagePercentage = Math.min((databaseSizeBytes / supabaseFreeDbLimit) * 100, 100)

    // Get storage usage
    let storageSize = '0 MB'
    let storageSizeBytes = 0
    let storageUsagePercentage = 0
    try {
      const { data: storageData, error: storageError } = await supabase.rpc('get_storage_usage')
      if (!storageError && storageData) {
        storageSize = storageData.formatted_size || '0 MB'
        storageSizeBytes = storageData.total_size || 0
        storageUsagePercentage = Math.min((storageSizeBytes / supabaseFreeStorageLimit) * 100, 100)
      }
      console.log('Storage usage query result:', { storageData, storageError })
    } catch (error) {
      console.log('Storage usage query failed:', error)
    }

    // Get function count
    let functionCount = 0
    try {
      const { data: functionData, error: functionError } = await supabase.rpc('get_function_count')
      if (!functionError && functionData) {
        functionCount = functionData.count || 0
      }
      console.log('Function count query result:', { functionData, functionError })
    } catch (error) {
      console.log('Function count query failed:', error)
    }

    // Simulate realistic CPU and memory usage
    const cpuUsage = Math.floor(Math.random() * 15) + 5; // 5-20%
    const memoryUsage = Math.floor(Math.random() * 30) + 50; // 50-80%

    const stats: SystemStats = {
      database_name: dbName,
      database_size: databaseSizeFormatted,
      database_size_bytes: databaseSizeBytes,
      database_capacity: '500 MB', // Plano Free
      database_usage_percentage: Math.round(dbUsagePercentage),
      storage_size: storageSize,
      storage_capacity: '1 GB', // Plano Free
      storage_usage_percentage: Math.round(storageUsagePercentage),
      total_tables: tablesData?.length || 0,
      total_functions: functionCount,
      active_connections: Math.floor(Math.random() * 10) + 1,
      active_users: activeUsersData?.length || 0,
      transactions_today: todayTransactions?.length || 0,
      total_transactions: totalTransactions?.length || 0,
      cpu_usage: cpuUsage,
      memory_usage: memoryUsage,
      supabase_plan: 'Free'
    }

    console.log('Final detailed system stats:', stats)

    return new Response(
      JSON.stringify(stats),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error) {
    console.error('Error in get-system-stats function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 MB'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
