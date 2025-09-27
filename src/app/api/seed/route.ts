import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { initialStudents } from '@/app/lib/data';

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
      console.warn("Firebase Admin SDK credentials not found. Skipping initialization.");
    }
  }
} catch (e) {
  console.error('Error initializing Firebase Admin SDK:', e);
}


const db = getFirestore();

export async function POST() {
  try {
    const studentsRef = db.collection('students');
    const snapshot = await studentsRef.get();

    if (snapshot.empty) {
      console.log('No students found, seeding initial data...');
      const batch = db.batch();
      initialStudents.forEach(student => {
        const studentDocRef = studentsRef.doc(student.id);
        batch.set(studentDocRef, { name: student.name, rfid: student.rfid });
      });
      await batch.commit();
      return NextResponse.json({ success: true, message: 'Initial student data seeded successfully.' });
    } else {
      return NextResponse.json({ success: true, message: 'Students collection already contains data.' });
    }
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ success: false, message: 'Internal server error during seeding.' }, { status: 500 });
  }
}
