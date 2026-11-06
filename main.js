const STORAGE_KEY = "edutrack_students_v1";
let students = loadStudents();
let editingId = null;
let selectedResultId = null;

const $ = (id) => document.getElementById(id);
const form = $("student-form");

function loadStudents() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}
function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}
function average(student) {
  return (Number(student.grade1) + Number(student.grade2) + Number(student.grade3)) / 3;
}
function getGrade(avg) {
  if (avg >= 85) return {name:"ممتاز", className:"pill-excellent"};
  if (avg >= 75) return {name:"جيد جداً", className:"pill-very-good"};
  if (avg >= 65) return {name:"جيد", className:"pill-good"};
  if (avg >= 50) return {name:"مقبول", className:"pill-pass"};
  return {name:"ضعيف", className:"pill-fail"};
}
function getStatus(avg) {
  return avg >= 50 ? "ناجح" : "راسب";
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function renderStats() {
  const count = students.length;
  const passed = students.filter(s => getStatus(average(s)) === "ناجح").length;
  const avg = count ? students.reduce((sum,s) => sum + average(s),0) / count : null;
  $("total-count").textContent = count;
  $("passed-count").textContent = passed;
  $("failed-count").textContent = count - passed;
  $("overall-average").textContent = avg === null ? "—" : avg.toFixed(1) + "%";
}
function renderStudents(filter = "") {
  const body = $("students-table-body");
  const term = filter.trim().toLowerCase();
  const filtered = students.filter(s => String(s.id).toLowerCase().includes(term) || s.name.toLowerCase().includes(term));
  body.innerHTML = filtered.map(s => {
    const avg = average(s), grade = getGrade(avg);
    return `<tr>
      <td>${escapeHTML(s.id)}</td><td class="student-name-cell">${escapeHTML(s.name)}</td>
      <td>${Number(s.grade1).toFixed(1)}</td><td>${Number(s.grade2).toFixed(1)}</td><td>${Number(s.grade3).toFixed(1)}</td>
      <td><strong>${avg.toFixed(1)}%</strong></td><td><span class="grade-pill ${grade.className}">${grade.name}</span></td>
      <td><div class="action-group"><button class="mini-btn" data-action="edit" data-id="${escapeHTML(s.id)}">تعديل</button><button class="mini-btn delete" data-action="delete" data-id="${escapeHTML(s.id)}">حذف</button></div></td>
    </tr>`;
  }).join("");
  $("empty-students").style.display = filtered.length ? "none" : "block";
  $("students-table-body").parentElement.parentElement.parentElement.classList.toggle("is-empty", filtered.length === 0);
  renderStats();
}
function renderResultsList() {
  const body = $("results-table-body");
  body.innerHTML = students.map(s => {
    const avg = average(s), grade = getGrade(avg), status = getStatus(avg);
    return `<tr><td>${escapeHTML(s.id)}</td><td class="student-name-cell">${escapeHTML(s.name)}</td>
      <td><strong>${avg.toFixed(1)}%</strong></td><td><span class="grade-pill ${grade.className}">${grade.name}</span></td>
      <td><span class="status-pill ${status === "ناجح" ? "pill-excellent" : "pill-fail"}">${status}</span></td>
      <td><button class="mini-btn" data-action="view" data-id="${escapeHTML(s.id)}">عرض النتيجة</button></td></tr>`;
  }).join("");
  $("empty-results").style.display = students.length ? "none" : "block";
  $("results-table-body").parentElement.parentElement.parentElement.classList.toggle("is-empty", students.length === 0);
}
function renderAll() {
  renderStudents($("student-search").value);
  renderResultsList();
}
function resetForm() {
  form.reset();
  editingId = null;
  $("student-id").disabled = false;
  $("form-title").textContent = "إضافة طالب جديد";
  $("save-btn").textContent = "حفظ بيانات الطالب";
  $("cancel-edit").classList.add("hidden");
  $("form-message").textContent = "";
}
form.addEventListener("submit", event => {
  event.preventDefault();
  const id = $("student-id").value.trim();
  const name = $("student-name").value.trim();
  const grade1 = Number($("grade1").value);
  const grade2 = Number($("grade2").value);
  const grade3 = Number($("grade3").value);
  const attendance = Number($("student-attendance").value);
  const message = $("form-message");
  if (!id || !name) return;
  if (![grade1,grade2,grade3,attendance].every(n => Number.isFinite(n) && n >= 0 && n <= 100)) {
    message.className = "message error";
    message.textContent = "تأكد أن الدرجات ونسبة الحضور أرقام من 0 إلى 100.";
    return;
  }
  const duplicate = students.some(s => String(s.id) === id && String(s.id) !== String(editingId));
  if (duplicate) {
    message.className = "message error";
    message.textContent = "رقم الطالب مسجل بالفعل. استخدم رقماً مختلفاً.";
    return;
  }
  const student = {id, name, grade1, grade2, grade3, attendance};
  if (editingId !== null) {
    const index = students.findIndex(s => String(s.id) === String(editingId));
    if (index !== -1) students[index] = student;
    showToast("تم تحديث بيانات الطالب بنجاح");
  } else {
    students.push(student);
    showToast("تمت إضافة الطالب بنجاح");
  }
  saveStudents();
  resetForm();
  renderAll();
});
$("cancel-edit").addEventListener("click", resetForm);
$("reset-btn").addEventListener("click", () => setTimeout(() => { $("form-message").textContent = ""; }, 0));
$("students-table-body").addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const student = students.find(s => String(s.id) === button.dataset.id);
  if (!student) return;
  if (button.dataset.action === "edit") {
    editingId = student.id;
    $("student-id").value = student.id;
    $("student-id").disabled = true;
    $("student-name").value = student.name;
    $("grade1").value = student.grade1;
    $("grade2").value = student.grade2;
    $("grade3").value = student.grade3;
    $("student-attendance").value = student.attendance;
    $("form-title").textContent = "تعديل بيانات الطالب";
    $("save-btn").textContent = "حفظ التعديلات";
    $("cancel-edit").classList.remove("hidden");
    $("form-message").textContent = "";
    window.scrollTo({top:0,behavior:"smooth"});
  } else if (button.dataset.action === "delete") {
    if (!confirm(`هل أنت متأكد من حذف الطالب ${student.name}؟`)) return;
    students = students.filter(s => String(s.id) !== String(student.id));
    if (String(selectedResultId) === String(student.id)) clearResult();
    saveStudents(); renderAll(); showToast("تم حذف الطالب");
  }
});
$("student-search").addEventListener("input", event => renderStudents(event.target.value));

function showResult(student) {
  if (!student) return;
  selectedResultId = student.id;
  const avg = average(student), grade = getGrade(avg), status = getStatus(avg);
  $("result-placeholder").classList.add("hidden");
  $("student-result").classList.remove("hidden");
  $("result-name").textContent = student.name;
  $("result-id").textContent = "ID: " + student.id;
  $("result-grade-badge").textContent = grade.name;
  $("result-grade-badge").className = "grade-badge " + grade.className;
  $("result-average").textContent = avg.toFixed(2) + "%";
  $("result-grade").textContent = grade.name;
  $("result-status").textContent = status;
  $("result-status").style.color = status === "ناجح" ? "var(--green)" : "var(--red)";
  $("result-attendance").textContent = Number(student.attendance).toFixed(1) + "%";
  $("grade-bars").innerHTML = [student.grade1,student.grade2,student.grade3].map((value,index) =>
    `<div class="grade-bar-row"><span>الدرجة ${index+1}</span><div class="bar-track"><div class="bar-fill" style="width:${Number(value)}%"></div></div><span class="grade-bar-value">${Number(value).toFixed(1)}%</span></div>`
  ).join("");
  $("result-summary").textContent = status === "ناجح" ? "أداء الطالب يحقق حد النجاح." : "الطالب لم يحقق الحد الأدنى للنجاح.";
}
function clearResult() {
  selectedResultId = null;
  $("student-result").classList.add("hidden");
  $("result-placeholder").classList.remove("hidden");
}
function findResult() {
  const term = $("result-search").value.trim().toLowerCase();
  if (!term) { showToast("اكتب اسم الطالب أو رقم ID أولاً"); return; }
  const student = students.find(s => String(s.id).toLowerCase() === term || s.name.toLowerCase().includes(term));
  if (!student) { clearResult(); showToast("لم يتم العثور على طالب بهذه البيانات"); return; }
  showResult(student);
}
$("find-result-btn").addEventListener("click", findResult);
$("result-search").addEventListener("keydown", e => { if (e.key === "Enter") findResult(); });
$("results-table-body").addEventListener("click", event => {
  const button = event.target.closest('button[data-action="view"]');
  if (!button) return;
  const student = students.find(s => String(s.id) === button.dataset.id);
  showResult(student);
  $("result-search").value = student ? student.id : "";
});
$("edit-result-btn").addEventListener("click", () => {
  const student = students.find(s => String(s.id) === String(selectedResultId));
  if (!student) return;
  switchPage("registration");
  $("students-table-body").querySelector(`[data-action="edit"][data-id="${CSS.escape(String(student.id))}"]`)?.click();
});

function switchPage(page) {
  document.querySelectorAll(".nav-link").forEach(btn => btn.classList.toggle("active", btn.dataset.page === page));
  $("registration-page").classList.toggle("active", page === "registration");
  $("results-page").classList.toggle("active", page === "results");
  $("page-title").textContent = page === "registration" ? "تسجيل الطلاب" : "الدرجات والتقديرات";
  $("page-subtitle").textContent = page === "registration" ? "أضف بيانات الطلاب ودرجاتهم ونظّم سجلاتك بسهولة." : "استعلم عن نتائج الطلاب واعرف المتوسط والتقدير النهائي.";
}
document.querySelectorAll(".nav-link").forEach(btn => btn.addEventListener("click", () => switchPage(btn.dataset.page)));

function csvEscape(value) {
  const text = String(value ?? "");
  return '"' + text.replace(/"/g, '""') + '"';
}
$("export-btn").addEventListener("click", () => {
  if (!students.length) { showToast("لا توجد بيانات لتصديرها"); return; }
  const rows = [["id","name","grade1","grade2","grade3","attendance"], ...students.map(s => [s.id,s.name,s.grade1,s.grade2,s.grade3,s.attendance])];
  const csv = "\uFEFF" + rows.map(row => row.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = "students-results.csv"; link.click();
  URL.revokeObjectURL(url);
  showToast("تم تجهيز ملف CSV");
});
function parseCSVLine(line) {
  const out = []; let value = ""; let quoted = false;
  for (let i=0;i<line.length;i++) {
    const ch = line[i];
    if (ch === '"' && line[i+1] === '"' && quoted) { value += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) { out.push(value); value = ""; }
    else value += ch;
  }
  out.push(value); return out;
}
$("csv-file").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const content = (await file.text()).replace(/^\uFEFF/, "");
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) throw new Error("الملف فارغ أو لا يحتوي على بيانات.");
    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    const required = ["id","name","grade1","grade2","grade3","attendance"];
    const indexes = required.map(h => headers.indexOf(h));
    if (indexes.some(i => i < 0)) throw new Error("عناوين الأعمدة غير صحيحة. راجع الصيغة الموضحة بجانب الاستيراد.");
    let added = 0, updated = 0, skipped = 0;
    for (const line of lines.slice(1)) {
      const cols = parseCSVLine(line);
      const obj = Object.fromEntries(required.map((h,i) => [h, cols[indexes[i]]?.trim() ?? ""]));
      const values = [obj.grade1,obj.grade2,obj.grade3,obj.attendance].map(Number);
      if (!obj.id || !obj.name || values.some(n => !Number.isFinite(n) || n < 0 || n > 100)) { skipped++; continue; }
      const record = {id:obj.id,name:obj.name,grade1:values[0],grade2:values[1],grade3:values[2],attendance:values[3]};
      const index = students.findIndex(s => String(s.id) === String(record.id));
      if (index >= 0) { students[index] = record; updated++; } else { students.push(record); added++; }
    }
    saveStudents(); renderAll();
    showToast(`تم الاستيراد: ${added} إضافة، ${updated} تحديث، ${skipped} تخطي`);
  } catch (error) {
    showToast(error.message || "تعذر قراءة الملف");
  } finally {
    event.target.value = "";
  }
});

$("today-date").textContent = new Intl.DateTimeFormat("ar-EG", {weekday:"long", day:"numeric", month:"long", year:"numeric"}).format(new Date());
$("year").textContent = new Date().getFullYear();
renderAll();
