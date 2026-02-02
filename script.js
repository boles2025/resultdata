// تنفيذ عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تعيين السنة الحالية في التذييل
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // تهيئة متغيرات
    let currentStudentData = null;
    
    // إعداد أحداث النقر
    setupEventListeners();
    
    // إعداد نموذج البحث
    const studentForm = document.getElementById('studentForm');
    studentForm.addEventListener('submit', handleStudentSearch);
    
    // إعداد رابط الدخول للإدارة
    document.getElementById('adminLink').addEventListener('click', showAdminLogin);
    document.getElementById('adminAccessLink').addEventListener('click', showAdminLogin);
    
    // إعداد نموذج الدخول للإدارة
    document.getElementById('adminLoginBtn').addEventListener('click', handleAdminLogin);
    
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
    
    // زر نسخ جميع البيانات
    document.getElementById('copyAllBtn').addEventListener('click', copyAllData);
    
    // زر حفظ كصورة
    document.getElementById('saveAsImageBtn').addEventListener('click', saveDataAsImage);
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

// نسخ جميع البيانات
function copyAllData() {
    if (!currentStudentData) return;
    
    const text = `اسم الطالب: ${currentStudentData.name}\nالفرقة: ${currentStudentData.group}\nاسم المستخدم: ${currentStudentData.username}\nكلمة المرور: ${currentStudentData.password}`;
    
    copyToClipboard(text);
    showToast('تم نسخ جميع البيانات بنجاح', 'success');
    
    // تأثير على الزر
    const btn = document.getElementById('copyAllBtn');
    btn.classList.add('copied');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check me-2"></i>تم النسخ';
    
    setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = originalText;
    }, 2000);
}

// حفظ البيانات كصورة (بدون أي إضافات)
function saveDataAsImage() {
    if (!currentStudentData) return;
    
    // إخفاء جميع العناصر غير المرغوب فيها مؤقتًا
    const elementsToHide = document.querySelectorAll('.card-header, .card-footer, .result-link-btn, #saveAsImageBtn, #copyAllBtn, #newSearchBtn, .copy-btn-single');
    const originalDisplays = [];
    
    elementsToHide.forEach(el => {
        originalDisplays.push(el.style.display);
        el.style.display = 'none';
    });
    
    // إنشاء عنصر مؤقت لعرض البيانات فقط
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
        position: fixed;
        left: -10000px;
        top: -10000px;
        width: 600px;
        padding: 40px;
        background: linear-gradient(135deg, #1a1a2e, #16213e);
        border-radius: 20px;
        color: white;
        font-family: 'Cairo', sans-serif;
    `;
    
    tempContainer.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #4cc9f0; margin-bottom: 10px;">بيانات الطالب</h2>
            <div style="height: 2px; background: linear-gradient(90deg, transparent, #4361ee, transparent); margin: 20px 0;"></div>
        </div>
        
        <div style="margin-bottom: 25px;">
            <div style="display: flex; margin-bottom: 15px; align-items: center;">
                <div style="color: #4cc9f0; font-weight: bold; width: 150px;">الاسم:</div>
                <div style="font-size: 18px;">${currentStudentData.name || 'غير محدد'}</div>
            </div>
            
            <div style="display: flex; margin-bottom: 15px; align-items: center;">
                <div style="color: #4cc9f0; font-weight: bold; width: 150px;">الفرقة:</div>
                <div style="font-size: 18px;">${currentStudentData.group || 'غير محدد'}</div>
            </div>
            
            <div style="display: flex; margin-bottom: 15px; align-items: center;">
                <div style="color: #4cc9f0; font-weight: bold; width: 150px;">اسم المستخدم:</div>
                <div style="font-size: 18px; font-family: 'Courier New', monospace; background: rgba(255,255,255,0.1); padding: 8px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
                    ${currentStudentData.username || 'غير محدد'}
                </div>
            </div>
            
            <div style="display: flex; margin-bottom: 15px; align-items: center;">
                <div style="color: #4cc9f0; font-weight: bold; width: 150px;">كلمة المرور:</div>
                <div style="font-size: 18px; font-family: 'Courier New', monospace; background: rgba(255,255,255,0.1); padding: 8px 15px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
                    ${currentStudentData.password || 'غير محدد'}
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #888; font-size: 14px;">
            نظام بيانات الطلاب - كلية الطب البيطري - جامعة المنيا
        </div>
    `;
    
    document.body.appendChild(tempContainer);
    
    // التقاط الصورة
    html2canvas(tempContainer, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
    }).then(canvas => {
        // إنشاء رابط للتنزيل
        const link = document.createElement('a');
        link.download = `بيانات_الطالب_${currentStudentData.name || 'غير_معروف'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        showToast('تم حفظ البيانات كصورة بنجاح', 'success');
        
        // تأثير على الزر
        const btn = document.getElementById('saveAsImageBtn');
        btn.classList.add('copied');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check me-2"></i>تم الحفظ';
        
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = originalText;
        }, 2000);
        
    }).catch(error => {
        console.error('خطأ في حفظ الصورة:', error);
        showToast('حدث خطأ أثناء حفظ الصورة', 'error');
    }).finally(() => {
        // إزالة العنصر المؤقت
        document.body.removeChild(tempContainer);
        
        // إعادة عرض العناصر المخفية
        elementsToHide.forEach((el, index) => {
            el.style.display = originalDisplays[index];
        });
    });
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

// عرض نافذة الدخول للإدارة
function showAdminLogin(e) {
    e.preventDefault();
    
    const adminLoginModal = new bootstrap.Modal(document.getElementById('adminLoginModal'));
    adminLoginModal.show();
    
    // تفريغ حقل كلمة المرور
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminLoginError').classList.add('d-none');
    
    // تأثير ظهور النافذة
    setTimeout(() => {
        document.querySelector('#adminLoginModal .modal-content').classList.add('fade-in-up');
    }, 100);
}

// التعامل مع دخول المدير
function handleAdminLogin() {
    const password = document.getElementById('adminPassword').value;
    const adminLoginError = document.getElementById('adminLoginError');
    
    // كلمة مرور المدير: 85208520
    if (password === '85208520') {
        // حفظ حالة الدخول
        localStorage.setItem('adminLoggedIn', 'true');
        localStorage.setItem('adminLoginTime', new Date().getTime());
        
        // تأثير نجاح
        document.getElementById('adminLoginBtn').classList.add('copied');
        document.getElementById('adminLoginBtn').innerHTML = '<i class="fas fa-check me-2"></i>تم الدخول';
        
        setTimeout(() => {
            // إغلاق النافذة
            const adminLoginModal = bootstrap.Modal.getInstance(document.getElementById('adminLoginModal'));
            adminLoginModal.hide();
            
            // الانتقال إلى واجهة الإدارة
            window.location.href = 'admin.html';
        }, 500);
    } else {
        // عرض خطأ
        adminLoginError.classList.remove('d-none');
        document.getElementById('adminPassword').focus();
        
        // اهتزاز الحقل
        document.getElementById('adminPassword').classList.add('shake');
        setTimeout(() => {
            document.getElementById('adminPassword').classList.remove('shake');
        }, 500);
    }
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
