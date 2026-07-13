const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');

// ============================================
// ENVIRONMENT VARIABLES
// ============================================
const {
    BOT_TOKEN,
    GUILD_ID,
    STAFF_ROLES,
    REVIEWER_ROLE_ID,
    ACCEPTED_ROLE_ID,
    BANNER_URL = "https://media.discordapp.net/attachments/1480969775344652470/1496647110525845625/DF7E4FDA-66D3-49FF-BD5E-7C746253AE2D.png",
    TICKET_CATEGORY_ID,
    TICKET_LOG_CHANNEL_ID,
    TRANSCRIPT_CHANNEL_ID,
    APP_PANEL_CHANNEL_ID,
    APP_REVIEW_CHANNEL_ID,
    APP_ACCEPTED_CHANNEL_ID,
    APP_REJECTED_CHANNEL_ID
} = process.env;

// ============================================
// CLIENT INITIALIZATION
// ============================================
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message]
});

// ============================================
// CONFIGURATION - NEW CHANNELS AND ROLE
// ============================================
const TICKET_PANEL_CHANNEL_ID_NEW = "1511854009139331255";  // Minecraft Report panel channel
const TICKET_PANEL_CHANNEL_ID_NORMAL = "1511873447641223381"; // Normal ticket panel channel
const TICKET_LOG_CHANNEL_ID_NEW = "1511854023127339088";    // Log channel
const SUPPORT_ROLE_ID = "1511853901937119322";               // Role that can control tickets

// Ticket types for Minecraft Report panel
const TICKET_TYPES = {
    help: { name: "Help", emoji: "🎫", color: "#38BDF8", desc: "Press to open a ticket for general assistance" },
    report: { name: "Report", emoji: "⚠️", color: "#EF4444", desc: "Press to open a ticket to report a player or bug" }
};

// Ticket types for Normal panel
const NORMAL_TICKET_TYPES = {
    general: { name: "General Support", emoji: "📝", color: "#5865F2", desc: "General questions and assistance" },
    question: { name: "Question", emoji: "❓", color: "#FEE75C", desc: "Ask anything you want to know" },
    feedback: { name: "Feedback", emoji: "💬", color: "#57F287", desc: "Share your feedback or suggestions" },
    other: { name: "Other", emoji: "📌", color: "#9B59B6", desc: "Any other topic not listed above" }
};

const APPLICATION_POSITIONS = {
    staff: { 
        name: "🛠 Staff Team", 
        emoji: "🛠", 
        color: "#5865F2", 
        description: "Help moderate and manage the community",
        roleId: "1508204459799613634"
    },
    wallpaper: { 
        name: "🖼 Wallpaper Uploader", 
        emoji: "🖼", 
        color: "#9C27B0", 
        description: "Submit high-quality PC and mobile wallpapers",
        roleId: "1509922150138646680"
    },
    event: { 
        name: "🎉 Event Hoster", 
        emoji: "🎉", 
        color: "#FEE75C", 
        description: "Organize fun community events",
        roleId: "1509922272323043461"
    },
    partnership: { 
        name: "🤝 Partnership", 
        emoji: "🤝", 
        color: "#57F287", 
        description: "Handle collaborations and partnerships",
        roleId: null
    },
    developer: { 
        name: "💻 Developer", 
        emoji: "💻", 
        color: "#17A2B8", 
        description: "Work on bots and coding projects",
        roleId: "1509921949717893201"
    }
};

// الأسئلة الجديدة ديال Staff Team
const STANDARD_APPLICATION_QUESTIONS = [
    { id: "fullname", question: "📝 What's your name ?", example: "Example: John Doe" },
    { id: "age", question: "🎂 How old are you ?", example: "Example: 18" },
    { id: "why", question: "💭 Why do you want to join Staff Team ?", example: "Example: I want to help the community grow..." },
    { id: "skills", question: "🛠️ Do you have skills ? What are they ?", example: "Example: Graphic design, moderation, coding..." },
    { id: "experience", question: "📜 Do you have experience ?", example: "Example: I was a mod on another server..." },
    { id: "availability", question: "⏰ How many hours can you be online ?", example: "Example: 3-4 hours per day" },
    { id: "device", question: "💻 Device :\nOption 1 : phone\nOption 2 : Computer\nOption 3 : Both/Bjouj bihom", example: "Example: Computer" }
];

// أسئلة Wallpaper Uploader
const WALLPAPER_APPLICATION_QUESTIONS = [
    { id: "type", question: "🖼 What type of wallpapers do you upload?", example: "Example: Gaming, Nature, Anime, Abstract, Minimalist, etc." },
    { id: "platform", question: "📱 PC or Mobile wallpapers? (Or both)", example: "Example: Both, PC (1920x1080), Mobile (1080x2340)" },
    { id: "origin", question: "🎨 Do you create wallpapers or collect them from other sources?", example: "Example: I create my own using Photoshop / I collect from various artists (with credit)" },
    { id: "portfolio", question: "🔗 Send wallpaper examples or portfolio links", example: "Example: https://imgur.com/a/..., https://deviantart.com/..." },
    { id: "activity", question: "⏱️ How active will you be uploading wallpapers? (Weekly / Daily)", example: "Example: I will upload 5-10 wallpapers per week" },
    { id: "motivation", question: "💡 Why do you want to upload wallpapers in this server?", example: "Example: I love sharing art and want to help grow the wallpaper community here." }
];

// Parse multiple roles from comma-separated strings
const staffRolesArray = STAFF_ROLES ? STAFF_ROLES.split(',').map(r => r.trim()).filter(r => r.length > 0) : [];
const reviewerRolesArray = REVIEWER_ROLE_ID ? REVIEWER_ROLE_ID.split(',').map(r => r.trim()).filter(r => r.length > 0) : [];

// Add support role to staff roles for ticket access
const allTicketAccessRoles = [...staffRolesArray];
if (SUPPORT_ROLE_ID && !allTicketAccessRoles.includes(SUPPORT_ROLE_ID)) {
    allTicketAccessRoles.push(SUPPORT_ROLE_ID);
}

// Ticket persistence storage
const TICKET_STORAGE_FILE = '/tmp/active_tickets.json';
let activeTickets = new Map();
let activeApplications = new Map();

// ============================================
// TICKET PERSISTENCE FUNCTIONS
// ============================================
function saveActiveTickets() {
    try {
        const ticketsToSave = [];
        for (const [channelId, data] of activeTickets) {
            ticketsToSave.push({
                channelId: channelId,
                userId: data.userId,
                userTag: data.userTag,
                type: data.type,
                createdAt: data.createdAt,
                claimedBy: data.claimedBy || null,
                claimedAt: data.claimedAt || null
            });
        }
        fs.writeFileSync(TICKET_STORAGE_FILE, JSON.stringify(ticketsToSave, null, 2));
        console.log(`💾 Saved ${ticketsToSave.length} active tickets to storage`);
    } catch (error) {
        console.error('Failed to save tickets:', error.message);
    }
}

function loadActiveTickets() {
    try {
        if (fs.existsSync(TICKET_STORAGE_FILE)) {
            const data = fs.readFileSync(TICKET_STORAGE_FILE, 'utf8');
            const tickets = JSON.parse(data);
            activeTickets.clear();
            for (const ticket of tickets) {
                activeTickets.set(ticket.channelId, {
                    userId: ticket.userId,
                    userTag: ticket.userTag,
                    type: ticket.type,
                    createdAt: ticket.createdAt,
                    claimedBy: ticket.claimedBy,
                    claimedAt: ticket.claimedAt
                });
            }
            console.log(`📂 Loaded ${activeTickets.size} active tickets from storage`);
            return true;
        }
    } catch (error) {
        console.error('Failed to load tickets:', error.message);
    }
    return false;
}

async function verifyAndCleanTickets(guild) {
    const validTickets = new Map();
    for (const [channelId, ticketData] of activeTickets) {
        const channel = guild.channels.cache.get(channelId);
        if (channel && channel.parentId === TICKET_CATEGORY_ID) {
            validTickets.set(channelId, ticketData);
        } else {
            console.log(`🗑️ Removing invalid ticket: ${channelId} (channel no longer exists or moved)`);
        }
    }
    activeTickets = validTickets;
    saveActiveTickets();
    console.log(`✅ Verified tickets: ${activeTickets.size} valid tickets remaining`);
}

// ============================================
// HELPER FUNCTIONS
// ============================================
async function sendLog(guild, channelId, embed) {
    if (!channelId) return;
    const channel = guild.channels.cache.get(channelId);
    if (channel) {
        await channel.send({ embeds: [embed] }).catch(err => console.error(`Failed to send log:`, err.message));
    }
}

async function generateTranscript(channel, ticketData) {
    try {
        const messages = await channel.messages.fetch({ limit: 200 });
        const sorted = Array.from(messages.values()).reverse();
        
        let transcript = `═══════════════════════════════════════════════════\n`;
        transcript += `                    🎫 TICKET TRANSCRIPT\n`;
        transcript += `═══════════════════════════════════════════════════\n\n`;
        transcript += `📋 Channel: ${channel.name}\n`;
        transcript += `📅 Created: ${channel.createdAt.toLocaleString()}\n`;
        transcript += `👤 Owner: ${ticketData.userTag || "Unknown"}\n`;
        transcript += `🆔 Channel ID: ${channel.id}\n`;
        transcript += `───────────────────────────────────────────────────\n\n`;
        
        for (const msg of sorted) {
            const timestamp = msg.createdAt.toLocaleString();
            const author = msg.author.tag;
            const content = msg.content || '[Embed or Attachment]';
            transcript += `[${timestamp}] ${author}:\n${content}\n───────────────────────────────────────────────────\n`;
        }
        
        transcript += `\n📊 Transcript Generated: ${new Date().toLocaleString()}\n`;
        transcript += `═══════════════════════════════════════════════════`;
        
        const filePath = `/tmp/transcript-${channel.id}-${Date.now()}.txt`;
        fs.writeFileSync(filePath, transcript);
        return filePath;
    } catch (error) {
        console.error(`Error generating transcript: ${error.message}`);
        return null;
    }
}

function canManageTickets(member) {
    if (!member) return false;
    if (SUPPORT_ROLE_ID && member.roles.cache.has(SUPPORT_ROLE_ID)) return true;
    if (staffRolesArray.length > 0 && staffRolesArray.some(roleId => member.roles.cache.has(roleId))) return true;
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
    return false;
}

function isReviewer(member) {
    if (!member) return false;
    if (reviewerRolesArray.length === 0) return false;
    return reviewerRolesArray.some(roleId => member.roles.cache.has(roleId));
}

function getSupportRoleMention() {
    if (SUPPORT_ROLE_ID) return `<@&${SUPPORT_ROLE_ID}>`;
    return "";
}

function getTicketAccessRoles() {
    const roles = [];
    if (SUPPORT_ROLE_ID) roles.push(SUPPORT_ROLE_ID);
    roles.push(...staffRolesArray);
    return roles;
}

function getTicketPermissionOverwrites() {
    const roleIds = getTicketAccessRoles();
    return roleIds.map(roleId => ({ 
        id: roleId, 
        allow: [
            PermissionFlagsBits.ViewChannel, 
            PermissionFlagsBits.SendMessages, 
            PermissionFlagsBits.ReadMessageHistory, 
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.UseExternalEmojis
        ] 
    }));
}

async function safeChannelBulkDelete(channel, limit = 10) {
    try {
        const messages = await channel.messages.fetch({ limit });
        if (messages.size === 0) return;
        
        const filteredMessages = messages.filter(msg => Date.now() - msg.createdTimestamp < 1209600000);
        
        if (filteredMessages.size > 0) {
            await channel.bulkDelete(filteredMessages);
        }
        
        for (const msg of messages.filter(msg => Date.now() - msg.createdTimestamp >= 1209600000).values()) {
            await msg.delete().catch(() => {});
        }
    } catch (error) {
        console.error(`Bulk delete error: ${error.message}`);
        const messages = await channel.messages.fetch({ limit }).catch(() => []);
        for (const msg of messages) {
            await msg.delete().catch(() => {});
        }
    }
}

// ============================================
// TICKET PANEL - MINECRAFT REPORT (LIKE THE IMAGE)
// ============================================
async function createMinecraftTicketPanel(channel) {
    await safeChannelBulkDelete(channel, 10);
    
    const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle("Bonbon Utilities | Cj & RCS crack か")
        .setDescription(
            `**Minecraft Support Tickets**\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `**Help**\n` +
            `Press to open a ticket for general assistance\n\n` +
            `**Report**\n` +
            `Press to open a ticket to report a player or bug\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `2026 BONBON™. We are here to help you!`
        )
        .setFooter({ text: "Premium Support System • 24/7", iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_help')
                .setLabel("Help")
                .setEmoji("🎫")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('ticket_report')
                .setLabel("Report")
                .setEmoji("⚠️")
                .setStyle(ButtonStyle.Danger)
        );
    
    await channel.send({ embeds: [embed], components: [row] });
}

// ============================================
// TICKET PANEL - NORMAL (NEW PANEL)
// ============================================
async function createNormalTicketPanel(channel) {
    await safeChannelBulkDelete(channel, 10);
    
    const embed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setTitle("Bonbon Utilities | Cj & RCS crack か")
        .setDescription(
            `**📬 General Support Tickets**\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `**📝 General Support**\n` +
            `Open a ticket for general questions and assistance\n\n` +
            `**❓ Question**\n` +
            `Ask anything you want to know\n\n` +
            `**💬 Feedback**\n` +
            `Share your feedback or suggestions\n\n` +
            `**📌 Other**\n` +
            `Any other topic not listed above\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `2026 BONBON™. We are here to help you!`
        )
        .setFooter({ text: "Support System • 24/7", iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('normal_ticket_general')
                .setLabel("General Support")
                .setEmoji("📝")
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('normal_ticket_question')
                .setLabel("Question")
                .setEmoji("❓")
                .setStyle(ButtonStyle.Success)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('normal_ticket_feedback')
                .setLabel("Feedback")
                .setEmoji("💬")
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('normal_ticket_other')
                .setLabel("Other")
                .setEmoji("📌")
                .setStyle(ButtonStyle.Danger)
        );
    
    await channel.send({ embeds: [embed], components: [row1, row2] });
}

// ============================================
// APPLICATION PANEL
// ============================================
async function createApplicationPanel(channel) {
    await safeChannelBulkDelete(channel, 10);
    
    const embed = new EmbedBuilder()
        .setTitle("Bonbon Utilities | Cj & RCS crack か")
        .setDescription(
            `> **📋 STAFF & CONTRIBUTOR APPLICATION SYSTEM**\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `**📌 AVAILABLE POSITIONS**\n` +
            `• 🛠 **Staff Team** - Moderate and manage the server\n` +
            `• 🖼 **Wallpaper Uploader** - Submit high-quality PC and mobile wallpapers\n` +
            `• 🎉 **Event Hoster** - Organize fun community events\n` +
            `• 🤝 **Partnership** - Handle collaborations and partnerships\n` +
            `• 💻 **Developer** - Work on bots and coding projects\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `**📝 APPLICATION PROCESS**\n` +
            `1️⃣ Select a position from the dropdown below\n` +
            `2️⃣ The bot will DM you with questions\n` +
            `3️⃣ Answer each question in the DM\n` +
            `4️⃣ Your application will be submitted for review\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `**✅ REQUIREMENTS**\n` +
            `• Be active and responsible\n` +
            `• Have good communication skills\n` +
            `• Follow server rules and guidelines\n` +
            `• Be at least 13 years old (Discord ToS)\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `*Select a position to begin your application* 🚀`
        )
        .setColor(0x2b2d31)
        .setImage(BANNER_URL)
        .setFooter({ text: "Application System • DM Based", iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('apply_select')
        .setPlaceholder('🎯 Select a position to apply for...')
        .addOptions([
            new StringSelectMenuOptionBuilder()
                .setLabel('🛠 Staff Team')
                .setDescription('Apply for a staff position')
                .setEmoji('🛠')
                .setValue('staff'),
            new StringSelectMenuOptionBuilder()
                .setLabel('🖼 Wallpaper Uploader')
                .setDescription('Submit high-quality PC and mobile wallpapers')
                .setEmoji('🖼')
                .setValue('wallpaper'),
            new StringSelectMenuOptionBuilder()
                .setLabel('🎉 Event Hoster')
                .setDescription('Apply as an event hoster')
                .setEmoji('🎉')
                .setValue('event'),
            new StringSelectMenuOptionBuilder()
                .setLabel('🤝 Partnership')
                .setDescription('Apply for partnerships')
                .setEmoji('🤝')
                .setValue('partnership'),
            new StringSelectMenuOptionBuilder()
                .setLabel('💻 Developer')
                .setDescription('Apply as a developer')
                .setEmoji('💻')
                .setValue('developer')
        ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await channel.send({ embeds: [embed], components: [row] });
}

// ============================================
// APPLICATION DM HANDLER
// ============================================
async function startApplication(user, position) {
    const positionConfig = APPLICATION_POSITIONS[position];
    if (!positionConfig) return false;
    
    if (activeApplications.has(user.id)) {
        await user.send("❌ You already have an active application in progress. Please complete or cancel it first.\nType `cancel` to cancel your current application.")
            .catch(() => {});
        return false;
    }
    
    const questions = position === 'wallpaper' ? WALLPAPER_APPLICATION_QUESTIONS : STANDARD_APPLICATION_QUESTIONS;
    
    const application = {
        userId: user.id,
        position: position,
        positionName: positionConfig.name,
        positionEmoji: positionConfig.emoji,
        positionColor: positionConfig.color,
        step: 0,
        answers: {},
        timestamp: Date.now(),
        questions: questions
    };
    
    activeApplications.set(user.id, application);
    
    const isWallpaper = position === 'wallpaper';
    const description = isWallpaper 
        ? `You are applying to become a **Wallpaper Uploader**.\n\nPlease answer **${questions.length} questions** about your wallpaper submissions.\n\nType \`cancel\` at any time to cancel your application.`
        : `I will ask you **${questions.length} questions**.\nPlease answer each question honestly.\n\n**Type \`cancel\` at any time to cancel your application.**\n\nLet's begin! 🚀`;
    
    const welcomeEmbed = new EmbedBuilder()
        .setTitle(`Bonbon Utilities | Cj & RCS crack か | ${positionConfig.emoji} ${positionConfig.name} Application`)
        .setDescription(description)
        .setColor(typeof positionConfig.color === 'string' ? parseInt(positionConfig.color.replace('#', ''), 16) : positionConfig.color)
        .setTimestamp();
    
    await user.send({ embeds: [welcomeEmbed] }).catch(() => {
        activeApplications.delete(user.id);
        return false;
    });
    
    await sendNextQuestion(user.id);
    return true;
}

async function sendNextQuestion(userId) {
    const application = activeApplications.get(userId);
    if (!application) return;
    
    const questions = application.questions || STANDARD_APPLICATION_QUESTIONS;
    
    if (application.step >= questions.length) {
        await submitApplication(userId);
        return;
    }
    
    const question = questions[application.step];
    const questionEmbed = new EmbedBuilder()
        .setTitle(`Bonbon Utilities | 📝 Question ${application.step + 1}/${questions.length}`)
        .setDescription(`**${question.question}**\n\n\`\`\`${question.example}\`\`\``)
        .setColor(0x5865F2)
        .setFooter({ text: "Type your answer below • Type 'cancel' to cancel" });
    
    const user = await client.users.fetch(userId).catch(() => null);
    if (user) {
        await user.send({ embeds: [questionEmbed] }).catch(() => {
            activeApplications.delete(userId);
        });
    }
}

async function processAnswer(userId, answer) {
    const application = activeApplications.get(userId);
    if (!application) return;
    
    const questions = application.questions || STANDARD_APPLICATION_QUESTIONS;
    const currentQuestion = questions[application.step];
    application.answers[currentQuestion.id] = answer;
    application.step++;
    activeApplications.set(userId, application);
    
    await sendNextQuestion(userId);
}

async function submitApplication(userId) {
    const application = activeApplications.get(userId);
    if (!application) return;
    
    const user = await client.users.fetch(userId).catch(() => null);
    if (!user) {
        activeApplications.delete(userId);
        return;
    }
    
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
        console.error("Guild not found!");
        activeApplications.delete(userId);
        return;
    }
    
    const reviewChannel = guild.channels.cache.get(APP_REVIEW_CHANNEL_ID);
    if (!reviewChannel) {
        console.error("Review channel not found!");
        await user.send("❌ Failed to submit application. Please contact an administrator.");
        activeApplications.delete(userId);
        return;
    }
    
    const embed = buildApplicationEmbed(application, user, null);
    
    const buttons = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`app_approve_${userId}_${application.position}`)
                .setLabel('Accepter')
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`app_deny_${userId}_${application.position}`)
                .setLabel('Refuser')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setLabel('Voir Profil')
                .setURL(`https://discord.com/users/${userId}`)
                .setStyle(ButtonStyle.Link)
        );
    
    await reviewChannel.send({ embeds: [embed], components: [buttons] });
    
    const isWallpaper = application.position === 'wallpaper';
    const successMessage = isWallpaper
        ? `Your application for **${application.positionName}** has been submitted!\n\n**What happens next?**\n• Our team will review your wallpaper samples\n• You will be contacted via DM if you're selected\n• Please be patient\n\nThank you for your interest in contributing wallpapers! 🎉`
        : `Your application for **${application.positionName}** has been submitted!\n\n**What happens next?**\n• Our team will review your application within 48 hours\n• You will be contacted via DM if you're selected\n• Please be patient\n\nThank you for your interest! 🎉`;
    
    const confirmEmbed = new EmbedBuilder()
        .setTitle("Bonbon Utilities | ✅ APPLICATION SUBMITTED")
        .setDescription(successMessage)
        .setColor(0x22C55E)
        .setTimestamp();
    
    await user.send({ embeds: [confirmEmbed] }).catch(() => {});
    
    activeApplications.delete(userId);
}

async function cancelApplication(userId) {
    const application = activeApplications.get(userId);
    if (!application) return false;
    
    activeApplications.delete(userId);
    
    const user = await client.users.fetch(userId).catch(() => null);
    if (user) {
        const cancelEmbed = new EmbedBuilder()
            .setTitle("Bonbon Utilities | ❌ Application Cancelled")
            .setDescription("Your application has been cancelled. You can start a new application anytime.")
            .setColor(0xEF4444)
            .setTimestamp();
        await user.send({ embeds: [cancelEmbed] }).catch(() => {});
    }
    return true;
}

function buildApplicationEmbed(application, user, status = null, reason = null) {
    const positionConfig = APPLICATION_POSITIONS[application.position];
    const isAccepted = status === 'accepted';
    const isRejected = status === 'rejected';
    
    let title = `${positionConfig.emoji} NEW APPLICATION - ${positionConfig.name}`;
    let color = typeof positionConfig.color === 'string' ? parseInt(positionConfig.color.replace('#', ''), 16) : positionConfig.color;
    let footerText = "Application awaiting review";
    
    if (isAccepted) {
        title = `${positionConfig.emoji} APPLICATION ACCEPTED - ${positionConfig.name}`;
        color = 0x22C55E;
        footerText = "Application approved";
    } else if (isRejected) {
        title = `${positionConfig.emoji} APPLICATION DENIED - ${positionConfig.name}`;
        color = 0xEF4444;
        footerText = "Application denied";
    }
    
    const embed = new EmbedBuilder()
        .setTitle(`Bonbon Utilities | ${title}`)
        .setDescription(
            `**Applicant:** ${user.tag} (<@${application.userId}>)\n` +
            `**Position:** ${positionConfig.name}\n` +
            `**Submitted:** <t:${Math.floor(application.timestamp / 1000)}:F>\n` +
            `**User ID:** \`${application.userId}\``
        )
        .setColor(color)
        .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setImage(BANNER_URL)
        .setTimestamp()
        .setFooter({ text: footerText });
    
    const isWallpaper = application.position === 'wallpaper';
    
    const standardLabels = {
        fullname: "📝 Full name",
        age: "🎂 Age",
        why: "💭 Why join staff team?",
        skills: "🛠️ Skills",
        experience: "📜 Experience",
        availability: "⏰ Availability",
        device: "💻 Device"
    };
    
    const wallpaperLabels = {
        type: "🖼 Wallpaper Types",
        platform: "📱 Platform",
        origin: "🎨 Origin (Created/Collected)",
        portfolio: "🔗 Portfolio / Examples",
        activity: "⏱️ Upload Activity",
        motivation: "💡 Motivation"
    };
    
    const labels = isWallpaper ? wallpaperLabels : standardLabels;
    
    for (const [key, value] of Object.entries(application.answers)) {
        const label = labels[key] || key;
        embed.addFields({ 
            name: label, 
            value: value.length > 1024 ? value.substring(0, 1021) + '...' : value, 
            inline: false 
        });
    }
    
    if (reason) {
        embed.addFields({ name: "❌ Reason", value: `> ${reason}`, inline: false });
    }
    
    return embed;
}

// ============================================
// READY EVENT
// ============================================
client.once('ready', async () => {
    console.log(`✨ ${client.user.tag} is online!`);
    console.log(`📋 Bonbon Utilities | Cj & RCS crack か - Ticket & Application Bot`);
    console.log(`🎫 Minecraft Ticket Panel Channel: ${TICKET_PANEL_CHANNEL_ID_NEW}`);
    console.log(`🎫 Normal Ticket Panel Channel: ${TICKET_PANEL_CHANNEL_ID_NORMAL}`);
    console.log(`📝 Ticket Log Channel: ${TICKET_LOG_CHANNEL_ID_NEW}`);
    console.log(`👑 Support Role: ${SUPPORT_ROLE_ID}`);
    
    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) {
        console.error("❌ Guild not found! Check GUILD_ID environment variable.");
        return;
    }

    loadActiveTickets();
    await verifyAndCleanTickets(guild);
    
    console.log(`\n📊 Staff Roles Loaded (${staffRolesArray.length}):`);
    staffRolesArray.forEach(roleId => {
        const role = guild.roles.cache.get(roleId);
        console.log(`  ✓ ${role ? role.name : 'Unknown role'} (${roleId})`);
    });

    console.log(`\n📊 Support Role:`);
    const supportRole = guild.roles.cache.get(SUPPORT_ROLE_ID);
    console.log(`  ✓ ${supportRole ? supportRole.name : 'Unknown role'} (${SUPPORT_ROLE_ID})`);

    console.log(`\n📊 Reviewer Roles Loaded (${reviewerRolesArray.length}):`);
    reviewerRolesArray.forEach(roleId => {
        const role = guild.roles.cache.get(roleId);
        console.log(`  ✓ ${role ? role.name : 'Unknown role'} (${roleId})`);
    });

    if (ACCEPTED_ROLE_ID) {
        const acceptedRole = guild.roles.cache.get(ACCEPTED_ROLE_ID);
        console.log(`\n✓ Accepted Role: ${acceptedRole ? acceptedRole.name : 'Unknown role'} (${ACCEPTED_ROLE_ID})`);
    }

    // Fix channel permissions for ticket panel channels - EVERYONE CAN SEE
    const fixChannelPermissions = async (channelId) => {
        const channel = client.channels.cache.get(channelId);
        if (channel) {
            try {
                await channel.permissionOverwrites.edit(guild.id, {
                    ViewChannel: true,
                    ReadMessageHistory: true
                });
                console.log(`✅ Fixed permissions for channel: ${channel.name} (${channelId})`);
            } catch (error) {
                console.error(`❌ Failed to fix permissions for ${channelId}:`, error.message);
            }
        }
    };

    await fixChannelPermissions(TICKET_PANEL_CHANNEL_ID_NEW);
    await fixChannelPermissions(TICKET_PANEL_CHANNEL_ID_NORMAL);
    if (APP_PANEL_CHANNEL_ID) await fixChannelPermissions(APP_PANEL_CHANNEL_ID);

    // Create Minecraft ticket panel
    const minecraftPanelChannel = client.channels.cache.get(TICKET_PANEL_CHANNEL_ID_NEW);
    if (minecraftPanelChannel) {
        await createMinecraftTicketPanel(minecraftPanelChannel);
        console.log("\n✅ Minecraft Ticket panel deployed in channel: " + TICKET_PANEL_CHANNEL_ID_NEW);
    } else {
        console.log(`\n❌ Minecraft Ticket panel channel ${TICKET_PANEL_CHANNEL_ID_NEW} not found!`);
    }

    // Create Normal ticket panel
    const normalPanelChannel = client.channels.cache.get(TICKET_PANEL_CHANNEL_ID_NORMAL);
    if (normalPanelChannel) {
        await createNormalTicketPanel(normalPanelChannel);
        console.log("✅ Normal Ticket panel deployed in channel: " + TICKET_PANEL_CHANNEL_ID_NORMAL);
    } else {
        console.log(`❌ Normal Ticket panel channel ${TICKET_PANEL_CHANNEL_ID_NORMAL} not found!`);
    }

    if (APP_PANEL_CHANNEL_ID) {
        const appPanelChannel = client.channels.cache.get(APP_PANEL_CHANNEL_ID);
        if (appPanelChannel) {
            await createApplicationPanel(appPanelChannel);
            console.log("✅ Application panel deployed!");
        }
    }

    console.log(`\n🚀 Bot is ready!`);
    console.log(`💾 Ticket persistence enabled - ${activeTickets.size} tickets restored`);
    console.log(`👀 All panel channels are now visible to everyone!`);
});

// ============================================
// TICKET SYSTEM - BUTTON HANDLER (MINECRAFT)
// ============================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    
    // Handle Minecraft ticket buttons
    if (interaction.customId.startsWith('ticket_')) {
        const type = interaction.customId.replace('ticket_', '');
        const typeConfig = TICKET_TYPES[type];
        if (!typeConfig) return;
        
        for (const [id, data] of activeTickets) {
            if (data.userId === interaction.user.id) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle("❌ TICKET LIMIT REACHED")
                    .setDescription(`> You already have an open ticket!\n> Please close your existing ticket before creating a new one.\n\n**Channel:** <#${id}>`)
                    .setColor(0xEF4444);
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
        
        await interaction.reply({ 
            embeds: [new EmbedBuilder().setDescription("🔄 `Creating your ticket...`").setColor(0x38BDF8)], 
            ephemeral: true 
        });
        
        const ticketName = `${type}-${interaction.user.username}`;
        
        try {
            const ticketOverwrites = getTicketPermissionOverwrites();
            
            const ticketChannel = await interaction.guild.channels.create({
                name: ticketName,
                type: ChannelType.GuildText,
                parent: TICKET_CATEGORY_ID,
                topic: `Ticket Owner: ${interaction.user.tag} (${interaction.user.id}) | Type: ${typeConfig.name}`,
                permissionOverwrites: [
                    { id: interaction.guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
                    ...ticketOverwrites
                ]
            });
            
            activeTickets.set(ticketChannel.id, { 
                userId: interaction.user.id, 
                userTag: interaction.user.tag,
                type: typeConfig.name,
                createdAt: Date.now()
            });
            saveActiveTickets();
            
            const welcomeEmbed = new EmbedBuilder()
                .setTitle(`Bonbon Utilities | ${typeConfig.emoji} ${typeConfig.name.toUpperCase()} TICKET`)
                .setDescription(
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `**👋 Welcome ${interaction.user}!**\n\n` +
                    `> **Ticket Type:** ${typeConfig.name}\n` +
                    `> **Category:** ${typeConfig.desc}\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `**📝 INSTRUCTIONS**\n` +
                    `• Please describe your issue in detail\n` +
                    `• Attach screenshots if possible\n` +
                    `• Our team will respond shortly\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `**🔒 TICKET CONTROLS**\n` +
                    `• Click **Close Ticket** to end this session\n` +
                    `• Click **Claim Ticket** to assign a staff member\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
                )
                .setColor(typeConfig.color)
                .setImage(BANNER_URL)
                .setFooter({ text: `Ticket ID: ${ticketChannel.id} | Support Team`, iconURL: interaction.guild.iconURL() })
                .setTimestamp();
            
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('CLOSE TICKET')
                        .setEmoji('🔒')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('claim_ticket')
                        .setLabel('CLAIM TICKET')
                        .setEmoji('🎫')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            const supportMention = getSupportRoleMention();
            const mentionText = `${interaction.user} | ${supportMention}`;
            await ticketChannel.send({ content: mentionText, embeds: [welcomeEmbed], components: [actionRow] });
            
            const logEmbed = new EmbedBuilder()
                .setTitle("Bonbon Utilities | 🎫 TICKET OPENED")
                .setDescription(`**User:** ${interaction.user.tag}\n**Type:** ${typeConfig.name}\n**Channel:** ${ticketChannel}`)
                .setColor(0x22C55E)
                .setTimestamp();
            await sendLog(interaction.guild, TICKET_LOG_CHANNEL_ID_NEW, logEmbed);
            
            const successEmbed = new EmbedBuilder()
                .setTitle("Bonbon Utilities | ✅ TICKET CREATED")
                .setDescription(`> Your ticket has been created!\n> **Channel:** ${ticketChannel}\n> Support team will assist you shortly.`)
                .setColor(0x22C55E);
            
            await interaction.editReply({ embeds: [successEmbed], ephemeral: true });
            
        } catch (err) {
            console.error(err);
            const errorEmbed = new EmbedBuilder()
                .setTitle("Bonbon Utilities | ❌ ERROR")
                .setDescription("> Failed to create ticket. Please contact an administrator.")
                .setColor(0xEF4444);
            await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    
    // Handle Normal ticket buttons
    else if (interaction.customId.startsWith('normal_ticket_')) {
        const type = interaction.customId.replace('normal_ticket_', '');
        const typeConfig = NORMAL_TICKET_TYPES[type];
        if (!typeConfig) return;
        
        for (const [id, data] of activeTickets) {
            if (data.userId === interaction.user.id) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle("❌ TICKET LIMIT REACHED")
                    .setDescription(`> You already have an open ticket!\n> Please close your existing ticket before creating a new one.\n\n**Channel:** <#${id}>`)
                    .setColor(0xEF4444);
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
        }
        
        await interaction.reply({ 
            embeds: [new EmbedBuilder().setDescription("🔄 `Creating your ticket...`").setColor(0x38BDF8)], 
            ephemeral: true 
        });
        
        const ticketName = `${type}-${interaction.user.username}`;
        
        try {
            const ticketOverwrites = getTicketPermissionOverwrites();
            
            const ticketChannel = await interaction.guild.channels.create({
                name: ticketName,
                type: ChannelType.GuildText,
                parent: TICKET_CATEGORY_ID,
                topic: `Ticket Owner: ${interaction.user.tag} (${interaction.user.id}) | Type: ${typeConfig.name}`,
                permissionOverwrites: [
                    { id: interaction.guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory] },
                    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
                    ...ticketOverwrites
                ]
            });
            
            activeTickets.set(ticketChannel.id, { 
                userId: interaction.user.id, 
                userTag: interaction.user.tag,
                type: typeConfig.name,
                createdAt: Date.now()
            });
            saveActiveTickets();
            
            const welcomeEmbed = new EmbedBuilder()
                .setTitle(`Bonbon Utilities | ${typeConfig.emoji} ${typeConfig.name.toUpperCase()} TICKET`)
                .setDescription(
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `**👋 Welcome ${interaction.user}!**\n\n` +
                    `> **Ticket Type:** ${typeConfig.name}\n` +
                    `> **Category:** ${typeConfig.desc}\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `**📝 INSTRUCTIONS**\n` +
                    `• Please describe your topic in detail\n` +
                    `• Provide any relevant information\n` +
                    `• Our team will respond shortly\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `**🔒 TICKET CONTROLS**\n` +
                    `• Click **Close Ticket** to end this session\n` +
                    `• Click **Claim Ticket** to assign a staff member\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
                )
                .setColor(typeConfig.color)
                .setImage(BANNER_URL)
                .setFooter({ text: `Ticket ID: ${ticketChannel.id} | Support Team`, iconURL: interaction.guild.iconURL() })
                .setTimestamp();
            
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('CLOSE TICKET')
                        .setEmoji('🔒')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('claim_ticket')
                        .setLabel('CLAIM TICKET')
                        .setEmoji('🎫')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            const supportMention = getSupportRoleMention();
            const mentionText = `${interaction.user} | ${supportMention}`;
            await ticketChannel.send({ content: mentionText, embeds: [welcomeEmbed], components: [actionRow] });
            
            const logEmbed = new EmbedBuilder()
                .setTitle("Bonbon Utilities | 🎫 TICKET OPENED")
                .setDescription(`**User:** ${interaction.user.tag}\n**Type:** ${typeConfig.name}\n**Channel:** ${ticketChannel}`)
                .setColor(0x22C55E)
                .setTimestamp();
            await sendLog(interaction.guild, TICKET_LOG_CHANNEL_ID_NEW, logEmbed);
            
            const successEmbed = new EmbedBuilder()
                .setTitle("Bonbon Utilities | ✅ TICKET CREATED")
                .setDescription(`> Your ticket has been created!\n> **Channel:** ${ticketChannel}\n> Support team will assist you shortly.`)
                .setColor(0x22C55E);
            
            await interaction.editReply({ embeds: [successEmbed], ephemeral: true });
            
        } catch (err) {
            console.error(err);
            const errorEmbed = new EmbedBuilder()
                .setTitle("Bonbon Utilities | ❌ ERROR")
                .setDescription("> Failed to create ticket. Please contact an administrator.")
                .setColor(0xEF4444);
            await interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
        }
    }
    
    else if (interaction.customId === 'close_ticket') {
        const ticketData = activeTickets.get(interaction.channel.id);
        if (!ticketData) {
            return interaction.reply({ content: "❌ This is not a valid ticket channel.", ephemeral: true });
        }
        
        if (!canManageTickets(interaction.member)) {
            return interaction.reply({ 
                embeds: [new EmbedBuilder().setDescription(`❌ Only ${getSupportRoleMention()} or staff members can close tickets.`).setColor(0xEF4444)], 
                ephemeral: true 
            });
        }
        
        await interaction.deferReply({ ephemeral: true });
        
        const transcriptPath = await generateTranscript(interaction.channel, ticketData);
        
        if (transcriptPath && TRANSCRIPT_CHANNEL_ID) {
            const transcriptChannel = interaction.guild.channels.cache.get(TRANSCRIPT_CHANNEL_ID);
            if (transcriptChannel) {
                const transcriptEmbed = new EmbedBuilder()
                    .setTitle("Bonbon Utilities | 📄 TICKET TRANSCRIPT")
                    .setDescription(`**Channel:** ${interaction.channel.name}\n**Closed by:** ${interaction.user.tag}\n**Type:** ${ticketData.type || 'Unknown'}\n**Owner:** ${ticketData.userTag || 'Unknown'}`)
                    .setColor(0xF97316)
                    .setTimestamp();
                await transcriptChannel.send({ embeds: [transcriptEmbed], files: [transcriptPath] });
            }
        }
        
        const logEmbed = new EmbedBuilder()
            .setTitle("Bonbon Utilities | 🔒 TICKET CLOSED")
            .setDescription(`**User:** ${ticketData.userTag}\n**Closed by:** ${interaction.user.tag}\n**Channel:** #${interaction.channel.name}`)
            .setColor(0xEF4444)
            .setTimestamp();
        await sendLog(interaction.guild, TICKET_LOG_CHANNEL_ID_NEW, logEmbed);
        
        try {
            await interaction.channel.delete();
            activeTickets.delete(interaction.channel.id);
            saveActiveTickets();
            if (transcriptPath) fs.unlinkSync(transcriptPath);
        } catch (err) {
            console.error(err);
        }
    }
    
    else if (interaction.customId === 'claim_ticket') {
        const ticketData = activeTickets.get(interaction.channel.id);
        if (!ticketData) {
            return interaction.reply({ content: "❌ This is not a valid ticket channel.", ephemeral: true });
        }
        
        if (!canManageTickets(interaction.member)) {
            return interaction.reply({ 
                embeds: [new EmbedBuilder().setDescription(`❌ Only ${getSupportRoleMention()} or staff members can claim tickets.`).setColor(0xEF4444)], 
                ephemeral: true 
            });
        }
        
        if (ticketData.claimedBy) {
            return interaction.reply({ 
                embeds: [new EmbedBuilder().setDescription(`❌ This ticket has already been claimed by <@${ticketData.claimedBy}>.`).setColor(0xEF4444)], 
                ephemeral: true 
            });
        }
        
        ticketData.claimedBy = interaction.user.id;
        ticketData.claimedAt = Date.now();
        activeTickets.set(interaction.channel.id, ticketData);
        saveActiveTickets();
        
        const claimEmbed = new EmbedBuilder()
            .setTitle("Bonbon Utilities | 🎫 TICKET CLAIMED")
            .setDescription(`> **${interaction.user}** has claimed this ticket and will assist you shortly.`)
            .setColor(0x22C55E)
            .setTimestamp();
        
        await interaction.reply({ embeds: [claimEmbed] });
        
        const logEmbed = new EmbedBuilder()
            .setTitle("Bonbon Utilities | 🎫 TICKET CLAIMED")
            .setDescription(`**Channel:** #${interaction.channel.name}\n**Staff:** ${interaction.user.tag}\n**Ticket Owner:** ${ticketData.userTag}`)
            .setColor(0x3B82F6)
            .setTimestamp();
        await sendLog(interaction.guild, TICKET_LOG_CHANNEL_ID_NEW, logEmbed);
    }
});

// ============================================
// APPLICATION SYSTEM - DROPDOWN HANDLER
// ============================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'apply_select') return;
    
    const selectedPosition = interaction.values[0];
    const positionConfig = APPLICATION_POSITIONS[selectedPosition];
    
    if (!positionConfig) {
        return interaction.reply({ content: "❌ Invalid position selected.", ephemeral: true });
    }
    
    try {
        await interaction.user.send({ content: "Starting application process..." });
    } catch (error) {
        return interaction.reply({ 
            content: "❌ I cannot send you a DM. Please enable DMs from server members and try again.", 
            ephemeral: true 
        });
    }
    
    const success = await startApplication(interaction.user, selectedPosition);
    
    if (success) {
        const questionCount = selectedPosition === 'wallpaper' ? WALLPAPER_APPLICATION_QUESTIONS.length : STANDARD_APPLICATION_QUESTIONS.length;
        await interaction.reply({ 
            content: `✅ Application process started! Please check your DMs (<@${interaction.user.id}>). You will be asked ${questionCount} questions.`,
            ephemeral: true 
        });
    } else {
        await interaction.reply({ 
            content: "❌ Failed to start application. You may already have an active application. Type `cancel` in DMs to cancel it.",
            ephemeral: true 
        });
    }
});

// ============================================
// DM MESSAGE HANDLER
// ============================================
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.guild) return;
    
    const userId = message.author.id;
    const content = message.content.trim();
    
    if (content.toLowerCase() === 'cancel') {
        const cancelled = await cancelApplication(userId);
        if (cancelled) {
            await message.reply("✅ Your application has been cancelled.");
        } else {
            await message.reply("❌ You don't have an active application to cancel.");
        }
        return;
    }
    
    const application = activeApplications.get(userId);
    if (!application) return;
    
    if (content.length < 1) {
        await message.reply("❌ Please provide a valid answer.");
        return;
    }
    
    await processAnswer(userId, content);
});

// ============================================
// APPLICATION REVIEW - ACCEPT BUTTON
// ============================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('app_approve_')) return;
    
    if (!isReviewer(interaction.member)) {
        const roleMentions = reviewerRolesArray.map(id => `<@&${id}>`).join(', ');
        return interaction.reply({ 
            embeds: [new EmbedBuilder()
                .setDescription(`❌ You don't have permission to review applications.\n\nRequired roles: ${roleMentions}`)
                .setColor(0xEF4444)
            ], 
            ephemeral: true 
        });
    }
    
    const parts = interaction.customId.split('_');
    const userId = parts[2];
    const position = parts[3];
    const positionConfig = APPLICATION_POSITIONS[position];
    
    if (!positionConfig) {
        return interaction.reply({ content: "❌ Invalid position.", ephemeral: true });
    }
    
    const guild = interaction.guild;
    const member = await guild.members.fetch(userId).catch(() => null);
    const user = await client.users.fetch(userId).catch(() => null);
    
    if (!user) {
        return interaction.reply({ content: "❌ User not found.", ephemeral: true });
    }
    
    const originalEmbed = interaction.message.embeds[0];
    const answers = {};
    
    const isWallpaper = position === 'wallpaper';
    const answerKeys = isWallpaper 
        ? ['type', 'platform', 'origin', 'portfolio', 'activity', 'motivation']
        : ['fullname', 'age', 'why', 'skills', 'experience', 'availability', 'device'];
    
    const answerFields = originalEmbed.fields.slice(4);
    for (let i = 0; i < answerFields.length && i < answerKeys.length; i++) {
        answers[answerKeys[i]] = answerFields[i].value;
    }
    
    const application = {
        userId: userId,
        position: position,
        positionName: positionConfig.name,
        positionEmoji: positionConfig.emoji,
        positionColor: positionConfig.color,
        answers: answers,
        timestamp: originalEmbed.timestamp ? new Date(originalEmbed.timestamp).getTime() : Date.now()
    };
    
    const acceptedEmbed = buildApplicationEmbed(application, user, 'accepted');
    await sendLog(guild, APP_ACCEPTED_CHANNEL_ID, acceptedEmbed);
    
    if (positionConfig.roleId && member) {
        try {
            await member.roles.add(positionConfig.roleId);
            console.log(`✅ Added role ${positionConfig.roleId} (${positionConfig.name}) to ${user.tag}`);
        } catch (error) {
            console.error(`Failed to add role to ${user.tag}:`, error.message);
        }
    }
    
    try {
        const isWallpaperSuccess = position === 'wallpaper';
        const successMessage = isWallpaperSuccess
            ? `**Congratulations ${user.username} !**\n\n` +
              `Your application for **${positionConfig.name}** has been **accepted** !\n\n` +
              `**Next steps:**\n` +
              `• A staff member will contact you shortly\n` +
              `• You will receive instructions for submitting wallpapers\n` +
              `• Welcome to the wallpaper contributor team! 🎉`
            : `**Congratulations ${user.username} !**\n\n` +
              `Your application for **${positionConfig.name}** has been **accepted** !\n\n` +
              `**Next steps:**\n` +
              `• A staff member will contact you shortly\n` +
              `• You will receive instructions to get started\n` +
              `• Welcome to the team ! 🎉`;
        
        const acceptDMEmbed = new EmbedBuilder()
            .setTitle("Bonbon Utilities | ✅ Félicitations ! Candidature Acceptée")
            .setDescription(successMessage)
            .setColor(0x22C55E)
            .setTimestamp();
        await user.send({ embeds: [acceptDMEmbed] });
    } catch (e) {
        console.log(`Could not DM ${userId}`);
    }
    
    await interaction.reply({ 
        embeds: [new EmbedBuilder()
            .setTitle("Bonbon Utilities | ✅ Candidature Acceptée")
            .setDescription(`Vous avez accepté la candidature de **${user.tag}** pour **${positionConfig.name}**.`)
            .setColor(0x22C55E)
        ], 
        ephemeral: false 
    });
    
    const row = ActionRowBuilder.from(interaction.message.components[0]);
    row.components.forEach(component => component.setDisabled(true));
    await interaction.message.edit({ components: [row] }).catch(() => {});
});

// ============================================
// APPLICATION REVIEW - DENY BUTTON
// ============================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('app_deny_')) return;
    
    if (!isReviewer(interaction.member)) {
        const roleMentions = reviewerRolesArray.map(id => `<@&${id}>`).join(', ');
        return interaction.reply({ 
            embeds: [new EmbedBuilder()
                .setDescription(`❌ You don't have permission to review applications.\n\nRequired roles: ${roleMentions}`)
                .setColor(0xEF4444)
            ], 
            ephemeral: true 
        });
    }
    
    const parts = interaction.customId.split('_');
    const userId = parts[2];
    const position = parts[3];
    
    const modal = new ModalBuilder()
        .setCustomId(`reject_modal_${userId}_${position}`)
        .setTitle("Refuser la candidature");
    
    const reasonInput = new TextInputBuilder()
        .setCustomId('reason')
        .setLabel("Raison du refus")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setPlaceholder("Ex: Manque d'expérience, disponibilité insuffisante...")
        .setMaxLength(1000);
    
    const row = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(row);
    
    client.denyMessageMap = client.denyMessageMap || new Map();
    client.denyMessageMap.set(`${userId}_${position}`, interaction.message);
    
    await interaction.showModal(modal);
});

// ============================================
// REJECT MODAL SUBMIT HANDLER
// ============================================
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    if (!interaction.customId.startsWith('reject_modal_')) return;
    
    const parts = interaction.customId.replace('reject_modal_', '').split('_');
    const userId = parts[0];
    const position = parts[1];
    const reason = interaction.fields.getTextInputValue('reason');
    
    const positionConfig = APPLICATION_POSITIONS[position];
    if (!positionConfig) {
        return interaction.reply({ content: "❌ Invalid position.", ephemeral: true });
    }
    
    const guild = interaction.guild;
    const user = await client.users.fetch(userId).catch(() => null);
    
    if (!user) {
        return interaction.reply({ content: "❌ User not found.", ephemeral: true });
    }
    
    const originalMessage = client.denyMessageMap?.get(`${userId}_${position}`);
    const originalEmbed = originalMessage?.embeds[0];
    
    const answers = {};
    if (originalEmbed) {
        const isWallpaper = position === 'wallpaper';
        const answerKeys = isWallpaper 
            ? ['type', 'platform', 'origin', 'portfolio', 'activity', 'motivation']
            : ['fullname', 'age', 'why', 'skills', 'experience', 'availability', 'device'];
        const answerFields = originalEmbed.fields.slice(4);
        for (let i = 0; i < answerFields.length && i < answerKeys.length; i++) {
            answers[answerKeys[i]] = answerFields[i].value;
        }
    }
    
    const application = {
        userId: userId,
        position: position,
        positionName: positionConfig.name,
        positionEmoji: positionConfig.emoji,
        positionColor: positionConfig.color,
        answers: answers,
        timestamp: originalEmbed ? new Date(originalEmbed.timestamp).getTime() : Date.now()
    };
    
    const rejectedEmbed = buildApplicationEmbed(application, user, 'rejected', reason);
    await sendLog(guild, APP_REJECTED_CHANNEL_ID, rejectedEmbed);
    
    try {
        const rejectDMEmbed = new EmbedBuilder()
            .setTitle("Bonbon Utilities | ❌ Candidature Refusée")
            .setDescription(
                `**Bonjour ${user.username}**,\n\n` +
                `Nous vous remercions d'avoir postulé pour **${positionConfig.name}**.\n\n` +
                `Malheureusement, votre candidature n'a pas été retenue pour le moment.\n\n` +
                `**Raison du refus:**\n> ${reason}\n\n` +
                `Vous pourrez postuler à nouveau dans 30 jours.\n\n` +
                `Merci de votre compréhension !`
            )
            .setColor(0xEF4444)
            .setTimestamp();
        await user.send({ embeds: [rejectDMEmbed] });
    } catch (e) {
        console.log(`Could not DM ${userId}`);
    }
    
    await interaction.reply({ 
        embeds: [new EmbedBuilder()
            .setTitle("Bonbon Utilities | ❌ Candidature Refusée")
            .setDescription(`Vous avez refusé la candidature de **${user.tag}** pour **${positionConfig.name}**.\n\n**Raison:** ${reason}`)
            .setColor(0xEF4444)
        ], 
        ephemeral: false 
    });
    
    const originalMessageToDisable = client.denyMessageMap?.get(`${userId}_${position}`);
    if (originalMessageToDisable) {
        const row = ActionRowBuilder.from(originalMessageToDisable.components[0]);
        row.components.forEach(component => component.setDisabled(true));
        await originalMessageToDisable.edit({ components: [row] }).catch(() => {});
        client.denyMessageMap.delete(`${userId}_${position}`);
    }
});

// ============================================
// GUILD MEMBER ADD - FIX PERMISSIONS FOR NEW MEMBERS
// ============================================
client.on('guildMemberAdd', async (member) => {
    // Ensure new members can see the ticket panel channels
    const panelChannels = [TICKET_PANEL_CHANNEL_ID_NEW, TICKET_PANEL_CHANNEL_ID_NORMAL];
    if (APP_PANEL_CHANNEL_ID) panelChannels.push(APP_PANEL_CHANNEL_ID);
    
    for (const channelId of panelChannels) {
        const channel = member.guild.channels.cache.get(channelId);
        if (channel) {
            try {
                // Make sure @everyone can see the channel
                await channel.permissionOverwrites.edit(member.guild.id, {
                    ViewChannel: true,
                    ReadMessageHistory: true
                });
            } catch (error) {
                console.error(`Failed to set permissions for ${channel.name}:`, error.message);
            }
        }
    }
});

// ============================================
// ERROR HANDLING
// ============================================
process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
});

// ============================================
// LOGIN
// ============================================
client.login(BOT_TOKEN);
