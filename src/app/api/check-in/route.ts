import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Use environment variables for Firebase Admin SDK credentials
const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
};

// Initialize Firebase Admin SDK
try {
  if (!getApps().length) {
    if (serviceAccount.project_id) {
      initializeApp({
        credential: cert(serviceAccount as any)
      });
    } else {
      console.warn("Firebase Admin SDK credentials not found in environment variables. Skipping initialization.");
    }
  }
} catch (e) {
  console.error('Error initializing Firebase Admin SDK:', e);
}


const db = getFirestore();

export async function POST(request: Request) {
  const { rfid, apiKey } = await request.json();

  if (!apiKey) {
    return NextResponse.json({ success: false, message: 'API Key is required' }, { status: 401 });
  }

  // Fetch the stored API key from Firestore
  try {
    const apiKeyDoc = await db.collection('settings').doc('apiKey').get();
    if (!apiKeyDoc.exists || apiKeyDoc.data()?.key !== apiKey) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error verifying API key:', error);
    return NextResponse.json({ success: false, message: 'Internal server error during auth' }, { status: 500 });
  }


  if (!rfid) {
    return NextResponse.json({ success: false, message: 'RFID is required' }, { status: 400 });
  }

  try {
    const studentsRef = db.collection('students');
    const studentSnapshot = await studentsRef.where('rfid', '==', rfid).limit(1).get();

    if (studentSnapshot.empty) {
      return NextResponse.json({ success: false, message: 'Student not found' }, { status: 404 });
    }

    const studentDoc = studentSnapshot.docs[0];
    const student = { id: studentDoc.id, ...studentDoc.data() };

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const attendanceRef = db.collection('rfid');
    const attendanceSnapshot = await attendanceRef
      .where('uid', '==', rfid)
      .where('timestamp', '>=', todayStart)
      .limit(1)
      .get();

    if (!attendanceSnapshot.empty) {
      return NextResponse.json({ success: true, message: 'Already checked in' });
    }

    await attendanceRef.add({
      uid: rfid,
      timestamp: new Date(),
    });

    return NextResponse.json({ success: true, message: `Checked in ${student.name}` });

  } catch (error) {
    console.error('Error during check-in:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
