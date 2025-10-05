const readline = require('readline')
const fs = require('fs')
const path = require('path')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

console.log('\n🚀 Self-Service Terminal - Выбор режима работы\n')
console.log('Доступные режимы:')
console.log('1. 🖥️  Локальный сервер (localhost:8080) - для разработки')
console.log('2. 🌐 Публичный сервер (83.222.9.90:8080) - продакшн')
console.log('')

function askMode() {
  rl.question('Выберите режим работы (1 или 2): ', (answer) => {
    let mode, serverInfo

    switch (answer.trim()) {
      case '1':
        mode = 'local'
        serverInfo = {
          mode: 'local',
          url: 'http://localhost:8080',
          name: 'Локальный сервер',
        }
        console.log('✅ Выбран локальный сервер (localhost:8080)')
        break
      case '2':
        mode = 'public'
        serverInfo = {
          mode: 'public',
          url: 'http://83.222.9.90:8080',
          name: 'Публичный сервер',
        }
        console.log('✅ Выбран публичный сервер (83.222.9.90:8080)')
        break
      default:
        console.log('❌ Неверный выбор. Пожалуйста, введите 1 или 2.')
        return askMode()
    }

    // Создаем .env файл для передачи конфигурации
    const envContent = `VITE_SERVER_MODE=${mode}\nVITE_SERVER_URL=${serverInfo.url}\nVITE_SERVER_NAME=${serverInfo.name}`

    try {
      fs.writeFileSync('.env.local', envContent)
      console.log(`📝 Настройки сохранены в .env.local`)
      console.log(`🎯 Приложение будет работать с: ${serverInfo.name}`)
      console.log('\n🚀 Запускаем приложение...\n')

      rl.close()

      // Запускаем Vite
      const { spawn } = require('child_process')
      const vite = spawn('npm', ['run', 'dev:start'], {
        stdio: 'inherit',
        shell: true,
      })

      vite.on('close', (code) => {
        process.exit(code)
      })
    } catch (error) {
      console.error('❌ Ошибка сохранения настроек:', error.message)
      process.exit(1)
    }
  })
}

askMode()
