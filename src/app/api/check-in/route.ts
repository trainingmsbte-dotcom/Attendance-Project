import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// IMPORTANT: Create a service account key in Firebase console and place it here
// Go to Project Settings -> Service accounts -> Generate new private key
// Then, copy the contents of the JSON file into a new file `serviceAccountKey.json` in the root of your project
try {
  const serviceAccount = require('../../../../serviceAccountKey.json');

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount)
    });
  }
} catch (e) {
  console.error('serviceAccountKey.json not found. Please create one in the root directory.');
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

    const attendanceRef = db.collection('attendance');
    const attendanceSnapshot = await attendanceRef
      .where('studentId', '==', student.id)
      .where('checkInTime', '>=', todayStart)
      .limit(1)
      .get();

    if (!attendanceSnapshot.empty) {
      return NextResponse.json({ success: true, message: 'Already checked in' });
    }

    await attendanceRef.add({
      studentId: student.id,
      checkInTime: new Date(),
    });

    return NextResponse.json({ success: true, message: `Checked in ${student.name}` });

  } catch (error) {
    console.error('Error during check-in:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
