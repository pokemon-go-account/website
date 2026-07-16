const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Ensure environment variables are loaded
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  console.error("Error: Missing Firebase environment variables.");
  process.exit(1);
}

// Replace literal \n with actual newlines in private key
privateKey = privateKey.replace(/\\n/g, "\n");

try {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
  console.log("Firebase Admin initialized successfully.");
} catch (error) {
  console.error("Initialization error:", error);
  process.exit(1);
}

const db = getFirestore();

async function purgeAllChats() {
  console.log("Fetching all chat documents...");
  const supportChatsSnapshot = await db.collection("supportChats").get();
  
  if (supportChatsSnapshot.empty) {
    console.log("No chats found in supportChats collection.");
    return;
  }

  console.log(`Found ${supportChatsSnapshot.size} chat(s). Beginning deletion...`);

  for (const doc of supportChatsSnapshot.docs) {
    const chatId = doc.id;
    console.log(`Deleting submessages for chat: ${chatId}`);
    
    // Delete subcollection "messages"
    const messagesRef = doc.ref.collection("messages");
    const messagesSnapshot = await messagesRef.get();
    
    if (!messagesSnapshot.empty) {
      const batch = db.batch();
      messagesSnapshot.docs.forEach((msgDoc) => {
        batch.delete(msgDoc.ref);
      });
      await batch.commit();
      console.log(`Deleted ${messagesSnapshot.size} message(s) from ${chatId}`);
    }

    // Delete the chat document itself
    await doc.ref.delete();
    console.log(`Successfully deleted chat document: ${chatId}`);
  }

  console.log("All chats and messages deleted successfully!");
}

purgeAllChats().catch((err) => {
  console.error("Error during deletion execution:", err);
  process.exit(1);
});
