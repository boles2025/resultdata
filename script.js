// تنفيذ عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تعيين السنة الحالية في التذييل
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // إعداد أحداث النقر
    setupEventListeners();
    
    // إعداد نموذج البحث
    const studentForm = document.getElementById('studentForm');
    studentForm.addEventListener('submit', handleStudentSearch);
    
    // إعداد دخول الإدارة
    const adminAccessLink = document.getElementById('adminAccessLink');
    if (adminAccessLink) adminAccessLink.addEventListener('click', showAdminLogin);
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    if (adminLoginBtn) adminLoginBtn.addEventListener('click', handleAdminLogin);
    
    // إعداد الزر للبحث الجديد
    document.getElementById('newSearchBtn').addEventListener('click', resetSearch);
    document.getElementById('tryAgainBtn').addEventListener('click', resetSearch);
    
    // إضافة تأثيرات للعناصر عند التمرير
    addScrollAnimations();
});

// إضافة تأثيرات التمرير
function addScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, observerOptions);
    
    // مراقبة جميع العناصر التي لها تأثيرات
    document.querySelectorAll('.glass-card').forEach(card => {
        observer.observe(card);
    });
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // أزرار النسخ المنفصلة
    document.querySelectorAll('.copy-btn-single').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const dataType = this.getAttribute('data-type');
            const text = document.getElementById(targetId).textContent;
            
            if (text && text !== '-') {
                copyToClipboard(text);
                showToast(`تم نسخ ${dataType} بنجاح`, 'success');
                
                // تأثير على الزر
                this.classList.add('copied');
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check me-1"></i>تم النسخ';
                
                setTimeout(() => {
                    this.classList.remove('copied');
                    this.innerHTML = originalText;
                }, 2000);
            } else {
                showToast('لا توجد بيانات للنسخ', 'warning');
            }
        });
    });
    
}

// البحث عن بيانات الطالب
function handleStudentSearch(e) {
    e.preventDefault();
    
    const nationalId = document.getElementById('nationalId').value.trim();
    
    // التحقق من صحة الرقم القومي
    if (!nationalId || nationalId.length !== 14 || !/^\d+$/.test(nationalId)) {
        showToast('الرجاء إدخال رقم قومي صحيح (14 رقمًا)', 'error');
        document.getElementById('nationalId').classList.add('shake');
        setTimeout(() => {
            document.getElementById('nationalId').classList.remove('shake');
        }, 500);
        return;
    }
    
    // عرض مؤشر التحميل
    const searchBtn = document.getElementById('searchBtn');
    const originalText = searchBtn.innerHTML;
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>جاري البحث...';
    searchBtn.disabled = true;
    
    // البحث في قاعدة البيانات
    const studentRef = database.ref('students/' + nationalId);
    
    studentRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
            // عرض بيانات الطالب
            const studentData = snapshot.val();
            currentStudentData = studentData;
            displayStudentData(studentData);
            
            // تحديث إحصائيات الدخول (دون عرضها للمستخدم)
            incrementLoginStats();
            
            // تأثير ظهور النتائج
            document.getElementById('resultsSection').style.display = 'block';
            document.getElementById('resultsSection').classList.add('fade-in-up');
        } else {
            // عرض رسالة عدم العثور
            document.getElementById('resultsSection').style.display = 'none';
            document.getElementById('notFoundSection').style.display = 'block';
            document.getElementById('notFoundSection').classList.add('fade-in-up');
            
            // اهتزاز النموذج
            document.getElementById('studentForm').classList.add('shake');
            setTimeout(() => {
                document.getElementById('studentForm').classList.remove('shake');
            }, 500);
        }
    }).catch(error => {
        console.error('خطأ في البحث:', error);
        showToast('حدث خطأ أثناء البحث. الرجاء المحاولة مرة أخرى', 'error');
    }).finally(() => {
        // إعادة تعيين الزر
        searchBtn.innerHTML = originalText;
        searchBtn.disabled = false;
    });
}

// عرض بيانات الطالب
function displayStudentData(studentData) {
    // تحديث البيانات في الواجهة
    document.getElementById('studentName').textContent = studentData.name || 'غير محدد';
    document.getElementById('studentGroup').textContent = studentData.group || 'غير محدد';
    document.getElementById('studentUsername').textContent = studentData.username || 'غير محدد';
    document.getElementById('studentPassword').textContent = studentData.password || 'غير محدد';
    
    // إخفاء رسالة عدم العثور
    document.getElementById('notFoundSection').style.display = 'none';
    
    // إضافة تأثيرات للبيانات
    animateDataItems();
}

// تأثيرات لعناصر البيانات
function animateDataItems() {
    const dataItems = document.querySelectorAll('.data-item');
    dataItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
        }, index * 100);
    });
}

// زيادة إحصائيات الدخول (دون عرضها)
function incrementLoginStats() {
    const statsRef = database.ref('stats');
    const today = new Date().toDateString();
    
    statsRef.once('value').then(snapshot => {
        if (snapshot.exists()) {
            const stats = snapshot.val();
            const lastLoginDate = stats.lastLoginDate || '';
            
            let updates = {
                totalLogins: (stats.totalLogins || 0) + 1
            };
            
            // إذا كان اليوم مختلف عن آخر دخول، إعادة تعيين دخول اليوم
            if (lastLoginDate !== today) {
                updates.todayLogins = 1;
                updates.lastLoginDate = today;
            } else {
                updates.todayLogins = (stats.todayLogins || 0) + 1;
            }
            
            statsRef.update(updates);
        }
    });
}

// عرض نافذة الدخول للإدارة
function showAdminLogin(e) {
    e.preventDefault();
    const modal = document.getElementById('adminLoginModal');
    if (!modal) return;
    new bootstrap.Modal(modal).show();
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminLoginError').classList.add('d-none');
}

// التعامل مع دخول المدير
function handleAdminLogin() {
    const password = document.getElementById('adminPassword').value;
    if (password === '85208520') {
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminLoginTime', new Date().getTime());
        const modal = bootstrap.Modal.getInstance(document.getElementById('adminLoginModal'));
        if (modal) modal.hide();
        window.location.href = 'admin.html';
    } else {
        document.getElementById('adminLoginError').classList.remove('d-none');
    }
}

// إعادة تعيين البحث
function resetSearch() {
    // إعادة تعيين النموذج
    document.getElementById('studentForm').reset();
    
    // إخفاء الأقسام
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('notFoundSection').style.display = 'none';
    
    // التركيز على حقل الإدخال
    document.getElementById('nationalId').focus();
}

// نسخ النص إلى الحافظة
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

// عرض رسالة منبثقة
function showToast(message, type = 'info') {
    // إنشاء عنصر الرسالة
    const toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white ${type === 'success' ? 'bg-success bg-opacity-90' : type === 'error' ? 'bg-danger bg-opacity-90' : 'bg-info bg-opacity-90'} border-0`;
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
