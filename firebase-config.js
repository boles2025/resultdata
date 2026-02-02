// إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCBVxpqtMCzKH2BTKr70gI9UUlbJuHzFEw",
    authDomain: "masrof2-9e67a.firebaseapp.com",
    databaseURL: "https://masrof2-9e67a-default-rtdb.firebaseio.com",
    projectId: "masrof2-9e67a",
    storageBucket: "masrof2-9e67a.firebasestorage.app",
    messagingSenderId: "958997909952",
    appId: "1:958997909952:web:975ba540314a6389abb825"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// تهيئة قاعدة البيانات
function initializeDatabase() {
    // إنشاء العقد الأساسية إذا لم تكن موجودة
    const statsRef = database.ref('stats');
    
    statsRef.once('value').then(snapshot => {
        if (!snapshot.exists()) {
            statsRef.set({
                totalLogins: 0,
                todayLogins: 0,
                lastLoginDate: new Date().toDateString(),
                totalStudents: 0
            });
        }
    });
    
    // إنشاء عقدة الطلاب إذا لم تكن موجودة
    const studentsRef = database.ref('students');
    studentsRef.once('value').then(snapshot => {
        if (!snapshot.exists()) {
            studentsRef.set({});
        }
    });
}

// استدعاء التهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initializeDatabase);