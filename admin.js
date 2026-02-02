// تنفيذ عند تحميل واجهة الإدارة
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من تسجيل دخول المدير
    if (!checkAdminLogin()) {
        window.location.href = 'index.html';
        return;
    }
    
    // تعيين السنة الحالية
    document.getElementById('adminCurrentYear').textContent = new Date().getFullYear();
    
    // تحميل بيانات الطلاب
    loadStudentsData();
    
    // تحديث الإحصائيات
    updateAdminStats();
    
    // إعداد أحداث النقر
    setupAdminEventListeners();
    
    // إعداد نموذج إضافة الطالب
    document.getElementById('addStudentForm').addEventListener('submit', handleAddStudent);
    
    // إعداد البحث
    document.getElementById('searchAdminBtn').addEventListener('click', handleAdminSearch);
    
    // زر تسجيل الخروج
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // إضافة تأثيرات التمرير
    addAdminScrollAnimations();
});

// إضافة تأثيرات التمرير في الإدارة
function addAdminScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.glass-card, .stat-card-admin').forEach(el => {
        observer.observe(el);
    });
}

// باقي الكود كما هو في الإصدار السابق...
// ... (جميع الدوال الأخرى تبقى كما هي)

// التحقق من تسجيل دخول المدير
function checkAdminLogin() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn');
    const loginTime = localStorage.getItem('adminLoginTime');
    
    if (!isLoggedIn || isLoggedIn !== 'true') {
        return false;
    }
    
    // التحقق من مدة الجلسة (8 ساعات)
    const currentTime = new Date().getTime();
    const sessionDuration = 8 * 60 * 60 * 1000; // 8 ساعات بالميلي ثانية
    
    if (currentTime - loginTime > sessionDuration) {
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminLoginTime');
        return false;
    }
    
    return true;
}

// تحديث إحصائيات لوحة التحكم
function updateAdminStats() {
    const statsRef = database.ref('stats');
    
    statsRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
            const stats = snapshot.val();
            
            document.getElementById('adminTotalStudents').textContent = stats.totalStudents || 0;
            document.getElementById('adminTodayLogins').textContent = stats.todayLogins || 0;
            document.getElementById('adminTotalLogins').textContent = stats.totalLogins || 0;
            
            const now = new Date();
            const timeString = now.getHours() + ':' + now.getMinutes();
            document.getElementById('adminLastUpdate').textContent = timeString;
        }
    });
}

// إعداد مستمعي الأحداث في لوحة التحكم
function setupAdminEventListeners() {
    // إظهار/إخفاء الأقسام
    document.getElementById('showAddStudentBtn').addEventListener('click', function() {
        showSection('addStudentSection');
    });
    
    document.getElementById('showUploadBtn').addEventListener('click', function() {
        showSection('uploadSection');
    });
    
    document.getElementById('showExportBtn').addEventListener('click', function() {
        showSection('exportSection');
    });
    
    document.getElementById('showDeleteAllBtn').addEventListener('click', function() {
        showSection('deleteAllSection');
    });
    
    // أزرار الإلغاء
    document.getElementById('cancelAddBtn').addEventListener('click', function() {
        hideSection('addStudentSection');
        document.getElementById('addStudentForm').reset();
    });
    
    document.getElementById('cancelUploadBtn').addEventListener('click', function() {
        hideSection('uploadSection');
        document.getElementById('excelFile').value = '';
    });
    
    document.getElementById('cancelExportBtn').addEventListener('click', function() {
        hideSection('exportSection');
    });
    
    document.getElementById('cancelDeleteBtn').addEventListener('click', function() {
        hideSection('deleteAllSection');
    });
    
    // رفع ملف Excel
    document.getElementById('uploadExcelBtn').addEventListener('click', handleExcelUpload);
    
    // تصدير البيانات
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);
    document.getElementById('exportPdfBtn').addEventListener('click', exportToPDF);
    
    // حذف جميع البيانات
    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteAllData);
}

// إظهار قسم معين وإخفاء الآخرين
function showSection(sectionId) {
    // إخفاء جميع الأقسام
    const sections = ['addStudentSection', 'uploadSection', 'exportSection', 'deleteAllSection'];
    sections.forEach(id => {
        hideSection(id);
    });
    
    // إظهار القسم المطلوب
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
        
        // إضافة تأثير ظهور
        section.classList.add('animate__fadeIn');
    }
}

// إخفاء قسم معين
function hideSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'none';
    }
}

// تحميل بيانات الطلاب
function loadStudentsData() {
    const studentsRef = database.ref('students');
    
    studentsRef.once('value').then(snapshot => {
        const studentsTableBody = document.getElementById('studentsTableBody');
        const noStudentsMessage = document.getElementById('noStudentsMessage');
        
        studentsTableBody.innerHTML = '';
        
        if (snapshot.exists()) {
            const students = snapshot.val();
            let index = 1;
            
            for (const nationalId in students) {
                if (students.hasOwnProperty(nationalId)) {
                    const student = students[nationalId];
                    addStudentToTable(index, nationalId, student);
                    index++;
                }
            }
            
            // تحديث العدد
            document.getElementById('studentsCount').textContent = `${index - 1} طالب`;
            
            // إخفاء رسالة عدم وجود بيانات
            noStudentsMessage.style.display = 'none';
        } else {
            // عرض رسالة عدم وجود بيانات
            noStudentsMessage.style.display = 'block';
            document.getElementById('studentsCount').textContent = '0 طالب';
        }
    }).catch(error => {
        console.error('خطأ في تحميل البيانات:', error);
        showAdminToast('حدث خطأ في تحميل بيانات الطلاب', 'error');
    });
}

// إضافة طالب إلى الجدول
function addStudentToTable(index, nationalId, student) {
    const studentsTableBody = document.getElementById('studentsTableBody');
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${index}</td>
        <td>${nationalId}</td>
        <td>${student.name || ''}</td>
        <td>${student.group || ''}</td>
        <td>${student.username || ''}</td>
        <td>${student.password || ''}</td>
        <td>
            <button class="btn btn-sm btn-danger delete-student-btn" data-id="${nationalId}">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    studentsTableBody.appendChild(row);
    
    // إضافة حدث الحذف
    const deleteBtn = row.querySelector('.delete-student-btn');
    deleteBtn.addEventListener('click', function() {
        const studentId = this.getAttribute('data-id');
        deleteStudent(studentId);
    });
}

// التعامل مع إضافة طالب جديد
function handleAddStudent(e) {
    e.preventDefault();
    
    // جمع البيانات من النموذج
    const nationalId = document.getElementById('addNationalId').value.trim();
    const name = document.getElementById('addName').value.trim();
    const group = document.getElementById('addGroup').value;
    const username = document.getElementById('addUsername').value.trim();
    const password = document.getElementById('addPassword').value.trim();
    
    // التحقق من صحة البيانات
    if (!nationalId || nationalId.length !== 14 || !/^\d+$/.test(nationalId)) {
        showAdminToast('الرجاء إدخال رقم قومي صحيح (14 رقمًا)', 'error');
        return;
    }
    
    if (!name || !group || !username || !password) {
        showAdminToast('الرجاء ملء جميع الحقول', 'error');
        return;
    }
    
    // حفظ الطالب في قاعدة البيانات
    const studentRef = database.ref('students/' + nationalId);
    
    studentRef.set({
        name: name,
        group: group,
        username: username,
        password: password,
        addedDate: new Date().toISOString()
    }).then(() => {
        // تحديث الإحصائيات
        updateStudentCount();
        
        // إعادة تحميل البيانات
        loadStudentsData();
        
        // إعادة تعيين النموذج
        document.getElementById('addStudentForm').reset();
        
        // إخفاء القسم
        hideSection('addStudentSection');
        
        // عرض رسالة نجاح
        showAdminToast('تم إضافة الطالب بنجاح', 'success');
    }).catch(error => {
        console.error('خطأ في إضافة الطالب:', error);
        showAdminToast('حدث خطأ أثناء إضافة الطالب', 'error');
    });
}

// التعامل مع رفع ملف Excel
function handleExcelUpload() {
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showAdminToast('الرجاء اختيار ملف Excel', 'error');
        return;
    }
    
    // التحقق من نوع الملف
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
        showAdminToast('الرجاء اختيار ملف Excel صالح', 'error');
        return;
    }
    
    // عرض شريط التقدم
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = uploadProgress.querySelector('.progress-bar');
    uploadProgress.style.display = 'block';
    progressBar.style.width = '0%';
    progressBar.textContent = '0%';
    
    // قراءة ملف Excel
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // الحصول على الورقة الأولى
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            
            // تحويل إلى JSON
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            // معالجة البيانات
            processExcelData(jsonData, uploadProgress, progressBar);
        } catch (error) {
            console.error('خطأ في قراءة الملف:', error);
            uploadProgress.style.display = 'none';
            showAdminToast('حدث خطأ في قراءة ملف Excel', 'error');
        }
    };
    
    reader.onerror = function() {
        uploadProgress.style.display = 'none';
        showAdminToast('حدث خطأ في قراءة الملف', 'error');
    };
    
    reader.readAsArrayBuffer(file);
}

// معالجة بيانات Excel
function processExcelData(data, uploadProgress, progressBar) {
    // تخطي الصف الأول (العناوين)
    const rows = data.slice(1);
    const totalRows = rows.length;
    let processedRows = 0;
    let successCount = 0;
    let errorCount = 0;
    
    // معالجة كل صف
    rows.forEach((row, index) => {
        // التأكد من وجود بيانات كافية
        if (row.length >= 5) {
            const nationalId = String(row[0]).trim();
            const name = String(row[1]).trim();
            const group = String(row[2]).trim();
            const username = String(row[3]).trim();
            const password = String(row[4]).trim();
            
            // التحقق من صحة الرقم القومي
            if (nationalId && nationalId.length === 14 && /^\d+$/.test(nationalId)) {
                // حفظ الطالب في قاعدة البيانات
                const studentRef = database.ref('students/' + nationalId);
                
                studentRef.set({
                    name: name,
                    group: group,
                    username: username,
                    password: password,
                    addedDate: new Date().toISOString(),
                    source: 'excel_upload'
                }).then(() => {
                    successCount++;
                }).catch(error => {
                    console.error(`خطأ في حفظ الصف ${index + 1}:`, error);
                    errorCount++;
                });
            } else {
                errorCount++;
            }
        } else {
            errorCount++;
        }
        
        // تحديث شريط التقدم
        processedRows++;
        const progress = Math.round((processedRows / totalRows) * 100);
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${progress}%`;
        
        // عند اكتمال المعالجة
        if (processedRows === totalRows) {
            setTimeout(() => {
                uploadProgress.style.display = 'none';
                
                // تحديث إحصائيات الطلاب
                updateStudentCount();
                
                // إعادة تحميل البيانات
                loadStudentsData();
                
                // عرض النتائج
                let message = `تم معالجة ${totalRows} صف`;
                if (successCount > 0) {
                    message += `، تم إضافة ${successCount} طالب بنجاح`;
                }
                if (errorCount > 0) {
                    message += `، فشل ${errorCount}`;
                }
                
                showAdminToast(message, successCount > 0 ? 'success' : 'warning');
                
                // إخفاء قسم الرفع
                hideSection('uploadSection');
                document.getElementById('excelFile').value = '';
            }, 500);
        }
    });
}

// تحديث عدد الطلاب في الإحصائيات
function updateStudentCount() {
    const studentsRef = database.ref('students');
    const statsRef = database.ref('stats');
    
    studentsRef.once('value').then(snapshot => {
        let count = 0;
        
        if (snapshot.exists()) {
            const students = snapshot.val();
            count = Object.keys(students).length;
        }
        
        // تحديث الإحصائيات
        statsRef.update({
            totalStudents: count
        }).then(() => {
            updateAdminStats();
        });
    });
}

// التعامل مع البحث في لوحة التحكم
function handleAdminSearch() {
    const searchType = document.getElementById('searchType').value;
    const searchQuery = document.getElementById('searchQuery').value.trim().toLowerCase();
    
    if (!searchQuery) {
        loadStudentsData();
        return;
    }
    
    const studentsRef = database.ref('students');
    
    studentsRef.once('value').then(snapshot => {
        const studentsTableBody = document.getElementById('studentsTableBody');
        const noStudentsMessage = document.getElementById('noStudentsMessage');
        
        studentsTableBody.innerHTML = '';
        
        if (snapshot.exists()) {
            const students = snapshot.val();
            let index = 1;
            let foundCount = 0;
            
            for (const nationalId in students) {
                if (students.hasOwnProperty(nationalId)) {
                    const student = students[nationalId];
                    
                    let match = false;
                    
                    // البحث حسب النوع
                    if (searchType === 'nationalId') {
                        match = nationalId.toLowerCase().includes(searchQuery);
                    } else if (searchType === 'name') {
                        match = (student.name || '').toLowerCase().includes(searchQuery);
                    } else if (searchType === 'group') {
                        match = (student.group || '').toLowerCase().includes(searchQuery);
                    }
                    
                    if (match) {
                        addStudentToTable(index, nationalId, student);
                        index++;
                        foundCount++;
                    }
                }
            }
            
            // تحديث العدد
            document.getElementById('studentsCount').textContent = `${foundCount} طالب`;
            
            if (foundCount > 0) {
                noStudentsMessage.style.display = 'none';
            } else {
                noStudentsMessage.style.display = 'block';
            }
        } else {
            noStudentsMessage.style.display = 'block';
            document.getElementById('studentsCount').textContent = '0 طالب';
        }
    });
}

// حذف طالب
function deleteStudent(nationalId) {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
        return;
    }
    
    const studentRef = database.ref('students/' + nationalId);
    
    studentRef.remove().then(() => {
        // تحديث الإحصائيات
        updateStudentCount();
        
        // إعادة تحميل البيانات
        loadStudentsData();
        
        showAdminToast('تم حذف الطالب بنجاح', 'success');
    }).catch(error => {
        console.error('خطأ في حذف الطالب:', error);
        showAdminToast('حدث خطأ أثناء حذف الطالب', 'error');
    });
}

// حذف جميع البيانات
function deleteAllData() {
    if (!confirm('هل أنت متأكد من حذف جميع بيانات الطلاب؟ هذا الإجراء لا يمكن التراجع عنه.')) {
        return;
    }
    
    const studentsRef = database.ref('students');
    
    studentsRef.remove().then(() => {
        // تحديث الإحصائيات
        updateStudentCount();
        
        // إعادة تحميل البيانات
        loadStudentsData();
        
        // إخفاء قسم الحذف
        hideSection('deleteAllSection');
        
        showAdminToast('تم حذف جميع البيانات بنجاح', 'success');
    }).catch(error => {
        console.error('خطأ في حذف جميع البيانات:', error);
        showAdminToast('حدث خطأ أثناء حذف البيانات', 'error');
    });
}

// تصدير البيانات إلى Excel
function exportToExcel() {
    const studentsRef = database.ref('students');
    
    studentsRef.once('value').then(snapshot => {
        if (!snapshot.exists()) {
            showAdminToast('لا توجد بيانات للتصدير', 'warning');
            return;
        }
        
        const students = snapshot.val();
        
        // تحضير البيانات
        const data = [['الرقم القومي', 'الاسم', 'الفرقة', 'اسم المستخدم', 'كلمة المرور', 'تاريخ الإضافة']];
        
        for (const nationalId in students) {
            if (students.hasOwnProperty(nationalId)) {
                const student = students[nationalId];
                data.push([
                    nationalId,
                    student.name || '',
                    student.group || '',
                    student.username || '',
                    student.password || '',
                    student.addedDate ? new Date(student.addedDate).toLocaleDateString('ar-EG') : ''
                ]);
            }
        }
        
        // إنشاء ورقة عمل
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        
        // إنشاء مصنف
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'الطلاب');
        
        // تصدير الملف
        XLSX.writeFile(workbook, `طلاب_${new Date().toISOString().slice(0, 10)}.xlsx`);
        
        showAdminToast('تم تصدير البيانات إلى Excel بنجاح', 'success');
    }).catch(error => {
        console.error('خطأ في تصدير Excel:', error);
        showAdminToast('حدث خطأ أثناء التصدير', 'error');
    });
}

// تصدير البيانات إلى PDF
function exportToPDF() {
    showAdminToast('ميزة تصدير PDF قيد التطوير', 'info');
    // يمكن إضافة مكتبة jsPDF هنا لإنشاء ملفات PDF
}

// تسجيل خروج المدير
function handleLogout() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminLoginTime');
    window.location.href = 'index.html';
}

// عرض رسالة في لوحة التحكم
function showAdminToast(message, type = 'info') {
    // إنشاء عنصر الرسالة
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} border-0`;
    toast.setAttribute('role', 'alert');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);
    
    // عرض الرسالة
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
    
    // إزالة الرسالة بعد الاختفاء
    toast.addEventListener('hidden.bs.toast', function() {
        toastContainer.remove();
    });
}