const mongoose = require('mongoose');
const crypto = require('crypto');

const uri = 'mongodb+srv://kumarrajatpradhan5537_db_user:urwdzLWzzryqmv2m@cluster0.g8xlcsu.mongodb.net/prime-chat?retryWrites=true&w=majority';
const secret = 'prime_chat_secure_aes_256_gcm_salt_2026';
const SECRET_KEY = crypto.scryptSync(secret, 'prime-chat-salt-2026', 32);

function encryptMessage(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', SECRET_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return { content: encrypted, iv: iv.toString('hex'), authTag };
}

function decryptMessage(data) {
  try {
    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(data.authTag, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', SECRET_KEY, iv);
    decipher.setAuthTag(authTag);
    let dec = decipher.update(data.content, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  } catch(e) {
    return data.content;
  }
}

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const calls = await db.collection('prime_calls').find({}).sort({ createdAt: 1 }).toArray();
  console.log('Found calls in prime-chat:', calls.length);

  for (const call of calls) {
    const conversationId = call.conversationId;
    if (!conversationId) continue;

    const alreadyMigrated = await db.collection('prime_messages').findOne({
      conversationId,
      createdAt: call.createdAt
    });

    if (!alreadyMigrated) {
      const isVideo = call.callType === 'video';
      let text = '';
      if (call.status === 'declined' || call.status === 'missed') {
        text = isVideo ? '🎥 Missed video call' : '📞 Missed audio call';
      } else if (call.status === 'ended') {
        if (call.durationSec && call.durationSec > 0) {
          const mins = Math.floor(call.durationSec / 60);
          const secs = call.durationSec % 60;
          const durText = mins > 0 ? (mins + 'm ' + secs + 's') : (secs + 's');
          text = (isVideo ? '🎥 Video call' : '📞 Audio call') + ' • ' + durText;
        } else {
          text = isVideo ? '🎥 Cancelled video call' : '📞 Cancelled call';
        }
      } else {
        text = (isVideo ? '🎥 Video call' : '📞 Audio call');
      }

      const enc = encryptMessage(text);
      await db.collection('prime_messages').insertOne({
        conversationId,
        senderId: call.callerId,
        senderName: call.callerName || 'User',
        senderAvatar: '',
        content: enc.content,
        iv: enc.iv,
        authTag: enc.authTag,
        effect: null,
        mediaType: 'call',
        mediaData: null,
        mediaName: null,
        mediaSize: null,
        audioDuration: call.durationSec || 0,
        reactions: [],
        replyTo: null,
        readBy: [{ userId: call.recipientId, readAt: call.endedAt || call.createdAt }],
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        clearedFor: [],
        expiresAt: null,
        createdAt: call.createdAt,
        updatedAt: call.endedAt || call.createdAt,
        __v: 0
      });
      console.log('Migrated call to message:', text, 'at', call.createdAt);
    }
  }

  // Update conversation lastMessage for each unique conversationId
  const convIds = [...new Set(calls.map(c => c.conversationId).filter(Boolean))];
  for (const convId of convIds) {
    const latestMsg = await db.collection('prime_messages').find({ conversationId: convId }).sort({ createdAt: -1 }).limit(1).toArray();
    if (latestMsg.length > 0) {
      const lm = latestMsg[0];
      const decText = decryptMessage({ content: lm.content, iv: lm.iv, authTag: lm.authTag });
      try {
        const objId = new mongoose.Types.ObjectId(convId);
        await db.collection('prime_conversations').updateOne(
          { _id: objId },
          {
            $set: {
              lastMessage: {
                text: decText,
                senderId: lm.senderId,
                senderName: lm.senderName,
                createdAt: lm.createdAt,
                mediaType: lm.mediaType || null,
                effect: lm.effect || null,
              },
              updatedAt: lm.createdAt
            }
          }
        );
        console.log('Updated conversation', convId, 'lastMessage to:', decText);
      } catch (e) {
        console.error('Error updating conv:', e.message);
      }
    }
  }

  console.log('Migration of calls in prime-chat complete!');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
