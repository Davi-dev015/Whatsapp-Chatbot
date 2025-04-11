const qrcode = require('qrcode-terminal');
const { Client, Buttons, List, MessageMedia } = require('whatsapp-web.js');
const client = new Client();
const userState = {}; // Guarda o estado de cada usuário
const userTimers = {}; // Guarda os temporizadores de cada usuário
const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const aplicativo = express();
const port = 3000;
const { app, BrowserWindow } = require('electron');
const path = require('path');

// Script para uso do Electron
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    // Carrega o arquivo HTML
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    // Abre o DevTools (opcional)
    // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
let qrCodeData = ''; // Variável para armazenar o QR Code gerado

aplicativo.use(cors()); // Permite requisições de outras origens

// Função para resetar o temporizador do usuário
function resetUserTimer(userId) {
    console.log(`Resetando temporizador para o usuário: ${userId}`);
    // Se já existe um temporizador para o usuário, cancela ele
    if (userTimers[userId]) {
        console.log(`Limpando temporizador existente para ${userId}`);
        clearTimeout(userTimers[userId]);
    }

    // Define um novo temporizador para esquecer o estado após 10 minutos
    userTimers[userId] = setTimeout(() => {
        delete userState[userId];
        delete userTimers[userId];
        console.log(`Estado do usuário ${userId} foi esquecido por inatividade.`);
    }, 600000); // 10 minutos = 600000 ms
}
console.log(`Timers ativos:`, userTimers);

// Leitor de QR Code
client.on('qr', qr => {
    qrCodeData = qr;
    console.log('QR Code atualizado:');
    qrcode.generate(qr, { small: true });
});
// Criar uma rota que converte o QR Code para uma imagem
aplicativo.get('/qrcode', async (req, res) => {
    if (!qrCodeData) {
        return res.status(404).json({ error: 'QR Code ainda não gerado' });
    }

    try {
        // Gerar a imagem do QR Code
        const qrCodeImage = await QRCode.toDataURL(qrCodeData);
        res.json({ qr: qrCodeImage });
    } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
        res.status(500).json({ error: 'Erro ao gerar QR Code' });
    }
});

aplicativo.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

// Confirmação de conexão
client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});

// Inicializa o cliente
client.initialize();

// Função de delay
const delay = ms => new Promise(res => setTimeout(res, ms));

// Manipulação de mensagens
client.on('message', async (msg) => {
    const userId = msg.from;

    if (!userState[userId]) {
        userState[userId] = 'início';
    }

resetUserTimer(userId)
console.log(`Mensagem recebida de ${userId}: ${msg.body}`);
console.log(`Estado atual do usuário: ${userState[userId]}`);
    // Resposta ao "Oi" ou outras saudações
    if (msg.body.match(/(menu|Menu|dia|tarde|noite|oi|Oi|Olá|olá|ola|Ola|ajuda|Ajuda)/i) && userState[userId] === 'início' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        const contact = await msg.getContact();
        const name = contact.pushname;

        await client.sendMessage(msg.from, `Olá ${name.split(" ")[0]}! Bem-vindo(a) ao Carmel Cumbuco 🌴. Sou seu assistente virtual e estou aqui para ajudar. Como posso te ajudar hoje? Por favor, digite uma das opções abaixo:
        \n1 - Informações sobre o resort 🏨
        \n2 - Experiências e atividades 🎉
        \n3 - Solicitação de serviços no quarto 🛎️
        \n4 - Problemas e reclamações ⚠️
        \n5 - Falar com um atendente 💬`);

        userState[userId] = 'menu_principal';
        return;
    }

    // Se o usuário escolheu a opção 1 (Informações sobre o resort)
    if (userState[userId] === 'menu_principal' && msg.body === '1') {
        const chat = await msg.getChat();
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);

        await client.sendMessage(msg.from, `Perfeito! Escolha uma das opções abaixo que represente a informação desejada:
            \n1 - Horários de funcionamento dos espaços ⏰
            \n2 - Informações sobre o SPA e serviços de bem-estar 💆
            \n3 - Localização e transporte 🚖
            \n4 - Regras e políticas do resort 📜`);

        userState[userId] = 'menu_1';
        return;
    }

// Se o usuário escolheu "Horários de funcionamento dos espaços" (subopção do menu 1)
if (userState[userId] === 'menu_1' && msg.body === '1') {
    const chat = await msg.getChat();
    await delay(1000);
    await chat.sendStateTyping();
    await delay(1000);
    await client.sendMessage(msg.from, `Nossos espaços funcionam nos seguintes horários:
    \n🏝️ *Bar da piscina*: 10h às 18h | Pool bar: 10am to 06pm
    \n🍹 *Bar da Praia*: 10h às 23h | Beach Bar: 10am to 11pm
    \n⛵ *Barco Bar*: 11h às 19h | Bar Boat: 11am to 07pm
    \n🌊 *Carmel Kite*: 09h às 17h | Carmel Kite: 09am to 05pm
    \n🎠 *Espaço infantil Carmelzinho*: 09h às 17h | Playground: 09am to 05pm
    \n🏋️ *Fitness Center*: 24h | Fitness Center: Open 24h
    \n💦 *Jacuzzis aquecidas*: 07h às 22h | Hot jacuzzis: 07am to 10pm
    \n🛍️ *Lojinha*: 09h às 17h | Store: 09am to 05pm
    \n🏊 *Piscina*: 07h às 18h | Pool: 07am to 06pm
    \n🍽️ *Restaurante*: 07h às 23h | Restaurant: 07am to 11pm
    \n🧖 *Sauna*: 07h às 22h | Steam Room: 07am to 10pm
    \n💆 *SPA Carmel by Caudalie*: 10h às 18h | SPA Carmel by Caudalie: 10am to 08pm
    \nSe precisar de mais informações, digite 1`);

    userState[userId] = 'menu_fim'; // Vai para o menu_fim
    return;
}
    if (userState[userId] === 'menu_1' && msg.body === '2') {
        const chat = await msg.getChat();
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(msg.from, `Nosso spa oferece diversas terapias para relaxamento. Está aberto diariamente das 10h às 18h. Gostaria de mais detalhes ou de agendar um horário?
            \n1 - ⏰ Agendar um horário.
            \n2 - ❓ Mais detalhes.`);
        userState[userId] = 'menu_spa';
        return;
}
    if (userState[userId] === 'menu_spa' && msg.body === '1') {
        const chat = await msg.getChat();
     await delay(1000);
     await chat.sendStateTyping();
     await delay(1000);
     await client.sendMessage(msg.from, `Um momento enquanto verificamos os horários disponíveis!`);
     return;
}
    if (userState[userId] === 'menu_spa' && msg.body === '2') {
        const chat = await msg.getChat();
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(msg.from, `O que gostaria de saber?`);
        return;
    }
    if (userState[userId] === 'menu_1' && msg.body === '3') {
        const chat = await msg.getChat();
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(msg.from, `Estamos localizados em Cumbuco, Ceará, a cerca de 35 km do Aeroporto de Fortaleza. Podemos organizar transfers para sua comodidade.
            \nSe precisar de mais ajuda, digite 1, ou informe se deseja um transfer para algum local.`)
        
        userState[userId] = 'menu_fim';
        return;
    }
    if (userState[userId] === 'menu_1' && msg.body === '4') {
        const chat = await msg.getChat();
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(msg.from, `Temos o compromisso de garantir uma experiência incrível. Para isso, seguimos algumas políticas: 
            \n1 - Check-in: a partir das 15h 🕒✅
            \n2 - Check-out: até às 12h 🕛❌
            \n3 - Política de não-fumantes nos quartos 🚭
            \nSe precisar de outras informações, digite 1.`);

        userState[userId] = 'menu_fim';
        return;
    }
    // Fim das opções do menu_1
    // Início das opções do menu_2
    if (userState[userId] === 'menu_principal' && msg.body === '2') {
        const chat = await msg.getChat();
        await delay(1000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(1000);
        await client.sendMessage(msg.from, `Descubra as experiências únicas que o Carmel Cumbuco oferece. Escolha uma opção abaixo para mais detalhes ou reservas:
            \n1 - Experiências a Dois 💑: Lua de Mel com decoração especial, café da manhã no quarto, jantar romântico e massagem para casais.
            \n2 - Experiências Gastronômicas 🍽️: Café na praia, piquenique à beira-mar, churrasco ao mar e jantar romântico.
            \n3 - Experiências ao Ar Livre 🌅: Passeios de jangada, a cavalo, bike na praia, beach tênis, cineminha ao ar livre. 
            \n4 - Aventuras 🏄‍♂️: Passeio de buggy, quadriciclo, UTV e aulas de kitesurf. 
            \n5 - Imersão Cultural 🎭: Oficina de argila com esculturas personalizadas`);
        userState[userId] = 'menu_2';
        return;
    }

    if (userState[userId] === 'menu_2' && msg.body === '1') {
        const chat = await msg.getChat();
        await delay(1000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(1000);
        await client.sendMessage(msg.from, `Experiências a Dois:
            \n✨ *Lua de Mel*: Celebre o amor com um pacote exclusivo, incluindo decoração romântica no quarto, café da manhã servido na acomodação, espumante Carmel Brut Rosé, mimo especial na chegada, um jantar romântico na Oca (restaurante na praia) e massagem para casal no Spa Carmel.
            \n📅 *Como Reservar*: Guest Relations ou recepção. com no mínimo 48 horas de antecedência.
            \n💰 *Valor: R$1380,00 por pacote.*
            \nSe precisar de mais informações, digite 1, ou informe se deseja fazer uma reserva.`)
        userState[userId] = 'menu_fim';
        return;
    }
    if (userState[userId] === 'menu_2' && msg.body === '2') {
        const chat = await msg.getChat();
        await delay(1000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(1000);
        await client.sendMessage(msg.from, `🥐 *Café na Praia*: Desfrute de um café da manhã pé na areia, com frutas frescas, pães variados, queijos, tapioca tradicional e geleias. Ideal para começar o dia em paz e contato com a natureza.
            \n📅 *Como reservar*: Guest Relations ou Recepção, 24h antes. 
            \n💰 *Valor: R$ 90,00 por pessoa*.
            \n🍷 *Jantar Romântico*: Experiência à luz de velas com entrada, prato principal e sobremesa, ambientada em um cenário natural decorado com charme e elegância.
            \n📅 *Como reservar*: Guest Relations ou Recepção, com no mínimo 24h de antecedência. 
            \n💰 *Valor: R$ 280,00 por pessoa*.
            \n🌅 *Piquenique Carmel*: Um momento único à beira-mar, com cestas de vime, almofadas confortáveis e delícias gastronômicas.
            \n📅 *Como reservar*: Guest Relations ou Recepção, 24h antes. 
            \n💰 *Valor: R$ 200,00 por pessoa*. 
            \n🔥 *Churrasco ao Mar*: Saboreie carnes, aves e frutos do mar preparados à brasa, acompanhados de especiarias regionais, ao som das ondas. Disponível às quartas e sábados, das 19h às 22h. 
            \n📅 *Como reservar*: Guest Relations ou Recepção, com 24h de antecedência. 
            \n💰 *Valor: R$ 350,00 por pessoa*.
            \nSe precisar de mais informações, digite 1, ou informe se deseja fazer uma reserva.`);
        userState[userId] = 'menu_fim';
        return;
    }
    if (userState[userId] === 'menu_2' && msg.body === '3') {
        const chat = await msg.getChat();
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(msg.from, `⛵ *Passeio de Jangada*: Viva a cultura nordestina com um passeio guiado por pescador local, incluindo histórias da região e uma pausa para banho de mar.
            \n📅 *Como reservar*: Guest Relations ou Recepção, 24h antes. 
            \n💰 *Valor: R$ 300,00 para até 2 pessoas (adicional de R$ 20,00 por pessoa extra)*.
            \n🐎 *Passeio a Cavalo*: Explore a praia e as dunas de Cumbuco, com opção de banho na lagoa.
            \n💰 *Opções: Passeio de 30 minutos (R$ 60,00) ou passeio de 1 hora com banho na lagoa (R$ 110,00)*.
            \n📅 *Como reservar*: Guest Relations ou Recepção, 24h antes.' 
            \n🚴 *Bike na Praia*: Bicicletas adaptadas para areia, perfeitas para um passeio em equilíbrio com a natureza.
            \n*Como usar: 1ª hora gratuita; horas adicionais por R$ 50,00. Solicite na recepção*.' 
            \n🎬 *Cineminha ao Ar Livre*: Sessões às terças, quintas e domingos, às 18h, com filmes incríveis, pés na areia e pipoca à vontade.
            \n💰 *Valor: Gratuito.*
            \nSe precisar de mais informações, digite 1, ou informe se deseja fazer uma reserva.`);
        userState[userId] = 'menu_fim';
        return;
    }
    if (userState[userId] === 'menu_2' && msg.body === '4') {
        const chat = await msg.getChat();
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(msg.from, `🏎️ *Passeio de Quadriciclo*: Descubra as dunas e praias em alta velocidade, acompanhado por guia credenciado. Duração de 2h30.
            \n📅 *Como reservar: Guest Relations ou Recepção, com no mínimo 6h de antecedência. 
            \n💰 *Valor: R$ 800,00 (até 2 pessoas no veículo).*
            \n🏎️ *Passeio de Buggy*: Um clássico pelas dunas, com paradas para fotos e prática de esquibunda.
            \n📅 *Como reservar*: Guest Relations ou Recepção, com 6h de antecedência. 
            \n💰 *Valor*: R$ 400,00 (até 4 pessoas).
            \n🏎️ *Passeio de UTV*: Aventura autônoma com veículos off-road, para explorar paisagens com liberdade.
            \n📅 *Como reservar*: Guest Relations ou Recepção, com antecedência de 6h.
            \n💰 *Valor*: R$ 2.000,00 (2 lugares) ou R$ 2.400,00 (4 lugares).
            \n🌊 *Aulas de Kitesurf*: Aprenda a dominar o vento e as ondas com instrutores credenciados na Praia do Cumbuco.
            \n📅 *Como reservar*: Guest Relations, Recepção ou Escola Carmel Kite, 24h antes.
            \n💰 *Valor*: R$ 300,00 por hora.
            \nSe precisar de mais informações, digite 1, ou informe se deseja fazer uma reserva.`);
        userState[userId] = 'menu_fim';
        return;
    }
    
    if (userState[userId] === 'menu_2' && msg.body === '5') {
        const chat = await msg.getChat();
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(msg.from, `👐 *Oficina Mãos na Argila*: Atividade interativa para modelar esculturas que podem ser levadas como recordação.
          \n🕐 *Como reservar: Guest Relations ou Recepção, com 24h de antecedência. Valor: R$ 350,00 por hora.*
          \nSe precisar de mais informações, digite 1, ou informe se deseja fazer uma reserva.`);
    userState[userId] = 'menu_fim';
    return;
    }
    // Fim das opções do menu_2, início das opções do menu_3
    if (userState[userId] ==='menu_principal' && msg.body === '3') {
        const chat = await msg.getChat();
        await delay(1000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(1000);
        await client.sendMessage(msg.from, `Perfeito! Escolha uma das opções abaixo que represente a informação desejada:
            \n1 - Pedido de amenities extras (toalhas, travesseiros, etc.) 🛏️🧴
            \n2 - Solicitação de limpeza ou manutenção 🧹🔧
            \n3 - Solicitação de late check-out ou early check-in ⏰🔄`
        )
    userState[userId] = 'menu_3';
    return;
    }
    if (userState[userId] === 'menu_3' && msg.body === '1') {
        const chat = await msg.getChat();
        await delay(1000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(1000);
        await client.sendMessage(msg.from, `Entendido, por gentileza poderia me dizer o número do seu quarto?`);
        userState[userId] = 'menu_solic';
        return;
    }
        if (userState[userId] === 'menu_solic') {
            const chat = await msg.getChat();
            await delay(1000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
            await chat.sendStateTyping(); // Simulando Digitação
            await delay(1000);
            await client.sendMessage(msg.from, `Tudo bem, por favor, informe o que precisa.`);
            userState[userId] = 'menu_solic1';
            return;
        }
    
        if (userState[userId] === 'menu_solic1') {
            const chat = await msg.getChat();
            await delay(1000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
            await chat.sendStateTyping(); // Simulando Digitação
            await delay(1000);
            await client.sendMessage(msg.from, `Entendido, peço que aguarde um momento, que nossa equipe irá atendê-lo o mais rápido possível ⏳🤝.
                \nSe precisar de mais informações, digite 1.`);
            userState[userId] = 'menu_fim';
            return;
    }

    if (userState[userId] === 'menu_3' && msg.body === '2') {
        const chat = await msg.getChat();
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(msg.from, `Tudo bem, por gentileza poderia nos informar o número do quarto?`);
        userState[userId] = 'menu_limpeza';
        return;

    }
        if (userState[userId] === 'menu_limpeza'){
            const chat = await msg.getChat();
            await delay(1000);
            await chat.sendStateTyping();
            await delay(1000);
            await client.sendMessage(msg.from, `Entendido, peço que nos informe o que precisa de limpeza ou manutenção.`);
            userState[userId] = 'menu_limpeza1';
            return;
        }
    if (userState[userId] === 'menu_limpeza1'){
        const chat = await msg.getChat();
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(msg.from, `Entendido, por favor aguarde um momento que já atenderemos sua solicitação ⏳🤝.
            \nSe precisar de mais informações, digite 1.`);
        userState[userId] = 'menu_fim';
        return;
    }
    if (userState[userId] === 'menu_3' && msg.body === '3'){
        const chat = await msg.getChat();
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(msg.from, `Late check-out e early check-in estão sujeitos à disponibilidade. Qual o número do seu quarto e qual horário você gostaria? Vamos verificar para você 🤝!`);
        userState[userId] = 'menu_early';
        return;
    }
    if (userState[userId] === 'menu_early'){
        const chat = await msg.getChat();
        await delay(1000);
        await chat.sendStateTyping();
        await delay(1000);
        await client.sendMessage(msg.from, `Ok! Peço que por favor aguarde um momento enquanto analisamos a possibilidade ⏳🤝`);
        return;
    }
// Fim das opções do menu_3, início das opções do menu_4
    if (userState[userId] === 'menu_principal' && msg.body === '4') {
        const chat = await msg.getChat();
        await delay(1000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(1000);
        await client.sendMessage(msg.from, `Entendi, escolha por favor a opção a seguir que mais se encaixa com a reclamação ou o problema que deseja relatar:
            \n1 - Reportar um problema no quarto 🛠️❗
            \n2 - Relatar uma experiência insatisfatória 😞🚫
            \n3 - Enviar um feedback ou sugestão 💬✨`);
        userState[userId] = 'menu_4';
        return;
    }
    if (userState[userId] === 'menu_4' && msg.body === '1') {
        const chat = await msg.getChat();
        await delay(1000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(1000);
        await client.sendMessage(msg.from, `Lamentamos pelo inconveniente. Por favor, descreva o problema e nossa equipe resolverá o mais rápido possível!`);
        return;    
    } 
    if (userState[userId] === 'menu_4' && msg.body === '2') {
        const chat = await msg.getChat();
        await delay(1000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(1000);
        await client.sendMessage(msg.from, `Sinto muito pela experiência. Estamos aqui para ouvir e corrigir o que for necessário. Pode nos contar o ocorrido?`);
        return;
    }
    if (userState[userId] === 'menu_4' && msg.body === '3') {
        const chat = await msg.getChat();
        await delay(1000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(1000);
        await client.sendMessage(msg.from, `Agradecemos por compartilhar sua opinião. Nos informe o que achou, para que possamos melhorar ainda mais nossos serviços!`);
        return;
    }
    if (userState[userId] === 'menu_principal' && msg.body === '5') {
        const chat = await msg.getChat();
        await delay(1000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(1000);
        await client.sendMessage(msg.from, 'Conectando você ao nosso time de Guest Relations. Por favor, aguarde um momento 🤝.');
        return;
}
    if (userState[userId] === 'menu_fim' && msg.body === '1'){
        const chat = await msg.getChat();
        await delay(1000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(1000);
        await client.sendMessage(msg.from, `Por favor, digite as seguintes opções para a continuidade do atendimento
            \n1 - Voltar ao menu principal 🔙.
            \n2 - Finalizar o atendimento ✅`);
        userState[userId] = 'menu_fim1';
        return;    
    }
        if (userState[userId] === 'menu_fim1' && msg.body === '1'){
            const chat = await msg.getChat();
            await delay(1000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
            await chat.sendStateTyping(); // Simulando Digitação
            await delay(1000);
            await client.sendMessage(msg.from, 
        `\n1 - Informações sobre o resort 🏨
        \n2 - Experiências e atividades 🎉
        \n3 - Solicitação de serviços no quarto 🛎️
        \n4 - Problemas e reclamações ⚠️
        \n5 - Falar com um atendente 💬`)
        userState[userId] = 'menu_principal';
        return;
        }
        if (userState[userId] === 'menu_fim1' && msg.body ==='2') {
            const chat = await msg.getChat();
            await delay(1000); //Delay de 3000 milisegundos mais conhecido como 3 segundos
            await chat.sendStateTyping(); // Simulando Digitação
            await delay(1000);
            await client.sendMessage(msg.from, `Muito obrigado por falar conosco, estamos à disposição!`);
            delete userState[userId];
            return;
        }
        
});