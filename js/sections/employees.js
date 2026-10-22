/* ==========================================================================
   RAILSAATHI - EMPLOYEE MANAGEMENT & BULK ACTIONS
   js/sections/employees.js
   ========================================================================== */

    const defaultSeedEmployees = [
      { id: 'seed-1', name: 'Ramesh Kumar', phone: '9876543210' },
      { id: 'seed-2', name: 'Suresh Kumar', phone: '9876543211' },
      { id: 'seed-3', name: 'Amit Kumar', phone: '9876543212' },
      { id: 'seed-4', name: 'Raj Kumar', phone: '9876543213' },
      { id: 'seed-5', name: 'Rajesh Kumar', phone: '9876543214' },
      { id: 'seed-6', name: 'Raj Kumar Singh', phone: '9876543215' },
      { id: 'seed-7', name: 'Nand Kishor', phone: '9876543216' },
      { id: 'seed-8', name: 'Mukesh Sharma', phone: '9876543217' },
      { id: 'seed-9', name: 'Manoj Verma', phone: '9876543218' },
      { id: 'seed-10', name: 'Anil Yadav', phone: '9876543219' },
      { id: 'seed-11', name: 'Dharmendra Singh', phone: '9876543220' },
      { id: 'seed-12', name: 'Sunil Gupta', phone: '9876543221' },
      { id: 'seed-13', name: 'Vikas Patel', phone: '9876543222' },
      { id: 'seed-14', name: 'Sanjay Meena', phone: '9876543223' },
      { id: 'seed-15', name: 'Dinesh Sharma', phone: '9876543224' },
      { id: 'seed-16', name: 'Rahul Kumar', phone: '9876543225' },
      { id: 'seed-17', name: 'Ajay Kumar', phone: '9876543226' }
    ];
    let employeeList = [...defaultSeedEmployees];
    window.employeeList = employeeList;


    function renderEmployeeTable() {
      const container = document.getElementById('admin-employee-list');
      if (!container) return;
      if (employeeList.length === 0) {
        container.innerHTML = `<div class="employee-list-card p-4 text-center text-slate-400 italic text-xs">No personnel found. Add some above.</div>`;
        return;
      }
      container.innerHTML = `<div class="employee-list-card">${employeeList.map((emp, index) => `
    <div class="employee-list-row">
      <div class="employee-list-person">
        <span class="employee-list-name">${emp.name || ''}</span>
        <span class="employee-list-phone">${emp.phone || ''}</span>
      </div>
      <div class="employee-list-actions">
        <button onclick="editEmployeeDirect(${index})" class="employee-list-action bg-blue-50 text-blue-600 hover:bg-blue-100" aria-label="Edit employee"><svg class="ui-icon"><use href="#icon-edit"></use></svg></button>
        <button onclick="deleteEmployeeDirect(${index})" class="employee-list-action bg-red-50 text-red-600 hover:bg-red-100" aria-label="Delete employee"><svg class="ui-icon"><use href="#icon-trash"></use></svg></button>
      </div>
    </div>`).join('')}</div>`;
    }



    // ── Direct employee actions (NO password prompt) ──
    function editEmployeeDirect(index) {
      if (!isAdminUser()) {
        customAlert('❌ Access Denied!\n\nYou do not have permission to edit employees.\nOnly administrators can modify employee records.');
        return;
      }
      document.getElementById('newName').value = employeeList[index].name;
      document.getElementById('newPhone').value = employeeList[index].phone;
      document.getElementById('editIndex').value = index;
      document.getElementById('editDbId').value = employeeList[index].id;
      document.getElementById('btnText').innerText = "Update Record";
      document.getElementById('cancelBtn').classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function deleteEmployeeDirect(index) {
      if (!isAdminUser()) {
        customAlert('❌ Access Denied!\n\nYou do not have permission to delete employees.\nOnly administrators can remove employee records.');
        return;
      }
      if (!confirm(`Delete "${employeeList[index].name}"? This cannot be undone.`)) return;
      try {
        const dbId = employeeList[index].id;
        const employeeName = employeeList[index].name;
        const employeePhone = employeeList[index].phone;

        await window.db.from("sample_employees").delete().eq('id', dbId);
        employeeList.splice(index, 1);

        // Log activity
        await logActivity('employee_deleted', {
          employeeName: employeeName,
          employeePhone: employeePhone,
          dbId: dbId
        });

        renderEmployeeTable(); setupForm(); showToast("Deleted from Sample Data!");
      } catch (error) {
        console.error("Delete error:", error);
        showToast("❌ Error: " + (error.message || "Unknown error"));
      }
    }

    async function saveEmployeeDirect() {
      if (!isAdminUser()) {
        customAlert('❌ Access Denied!\n\nYou do not have permission to add/edit employees.\nOnly administrators can manage employee records.');
        return;
      }
      const name = document.getElementById('newName').value.trim();
      const phone = document.getElementById('newPhone').value.trim();
      if (!name || phone.length !== 10) { customAlert("Valid name and 10-digit mobile required!"); return; }
      const idx = document.getElementById('editIndex').value;
      const dbId = document.getElementById('editDbId').value;
      try {
        if (idx !== "") {
          // Update existing record in sample_employees
          const oldName = employeeList[idx].name;
          const oldPhone = employeeList[idx].phone;

          await window.db.from("sample_employees").update({ name, phone }).eq('id', dbId);
          employeeList[idx].name = name; employeeList[idx].phone = phone;

          // Log activity
          await logActivity('employee_updated', {
            employeeId: dbId,
            oldName: oldName,
            oldPhone: oldPhone,
            newName: name,
            newPhone: phone
          });
        } else {
          // Insert new record into sample_employees
          const { data: newRecord, error } = await window.db.from("sample_employees").insert([{ name, phone }]).select();
          if (error) throw error;
          if (newRecord && newRecord[0]) {
            employeeList.push({ id: newRecord[0].id, name, phone });

            // Log activity
            await logActivity('employee_added', {
              employeeId: newRecord[0].id,
              name: name,
              phone: phone
            });
          }
        }
        cancelEdit(); renderEmployeeTable(); setupForm(); showToast("✅ Saved to Sample Data!");
      } catch (error) {
        console.error("Save error:", error);
        showToast("❌ Error: " + (error.message || "Unknown error"));
      }
    }



    let bulkRowsCount = 0, bulkRowIdCounter = 0, validBulkData = [];

    function openBulkModal() {
      if (!isAdminUser()) {
        customAlert('❌ Access Denied!\n\nYou do not have permission to add employees in bulk.\nOnly administrators can manage employee records.');
        return;
      }
      document.getElementById('bulk-rows-container').innerHTML = '';
      bulkRowsCount = 0; bulkRowIdCounter = 0;
      addBulkRow();
      document.getElementById('bulk-modal-overlay').style.display = 'flex';
    }
    function closeBulkModal() { document.getElementById('bulk-modal-overlay').style.display = 'none'; }

    function addBulkRow() {
      bulkRowIdCounter++; bulkRowsCount++;
      const container = document.getElementById('bulk-rows-container');
      const rowDiv = document.createElement('div');
      rowDiv.id = `bulk-row-${bulkRowIdCounter}`;
      rowDiv.className = 'flex gap-2 sm:gap-4 items-center mb-2 p-2 sm:p-3 bg-white rounded-lg border border-slate-200 shadow-sm bulk-row-item';
      rowDiv.innerHTML = `
    <div class="font-bold text-slate-400 w-6 text-center text-xs sm:text-sm row-serial">${bulkRowsCount}</div>
    <div class="flex-1 relative">
      <input type="text" aria-label="Employee Name" placeholder="Employee Name" class="w-full border-2 border-slate-200 p-2 sm:p-2.5 rounded-lg text-sm focus:border-blue-600 outline-none bulk-name-input transition-colors" autocomplete="off">
      <ul class="bulk-name-suggestions absolute top-full mt-1 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 hidden max-h-40 overflow-y-auto text-slate-800"></ul>
    </div>
    <div class="flex-1">
      <input type="number" aria-label="Phone Number" placeholder="10-digit Phone" class="w-full border-2 border-slate-200 p-2 sm:p-2.5 rounded-lg text-sm focus:border-blue-600 outline-none bulk-phone-input transition-colors">
    </div>
    <button onclick="removeBulkRow(${bulkRowIdCounter})" class="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors flex-shrink-0">
      <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
    </button>`;
      container.appendChild(rowDiv);
      updateSerialNumbers();
      container.scrollTop = container.scrollHeight;
    }

    function removeBulkRow(id) {
      if (bulkRowsCount <= 1) { customAlert("At least one row is required."); return; }
      const row = document.getElementById(`bulk-row-${id}`);
      if (row) { row.remove(); bulkRowsCount--; updateSerialNumbers(); }
    }

    function updateSerialNumbers() {
      const rows = document.querySelectorAll('.bulk-row-item');
      rows.forEach((row, index) => { row.querySelector('.row-serial').innerText = index + 1; });
      document.getElementById('bulk-row-count').innerText = `Total: ${bulkRowsCount}`;
    }

    // Direct bulk save (no password prompt needed — user is already logged in)
    function processBulkAddDirect() {
      if (!isAdminUser()) {
        customAlert('❌ Access Denied!\n\nYou do not have permission to add employees.\nOnly administrators can manage employee records.');
        return;
      }
      const rows = document.querySelectorAll('.bulk-row-item');
      validBulkData = [];
      const phoneSet = new Set();
      let hasError = false;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const nameInput = row.querySelector('.bulk-name-input');
        const phoneInput = row.querySelector('.bulk-phone-input');
        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        nameInput.classList.remove('border-red-500', 'bg-red-50');
        phoneInput.classList.remove('border-red-500', 'bg-red-50');
        if (!name) { nameInput.classList.add('border-red-500', 'bg-red-50'); hasError = true; }
        if (!phone || phone.length !== 10) { phoneInput.classList.add('border-red-500', 'bg-red-50'); hasError = true; }
        if (phone && phoneSet.has(phone)) {
          phoneInput.classList.add('border-red-500', 'bg-red-50'); hasError = true;
          customAlert(`Duplicate phone number found: ${phone}`); return;
        }
        if (!hasError && name && phone.length === 10) { phoneSet.add(phone); validBulkData.push({ name, phone }); }
      }
      if (hasError) { customAlert("Please fix highlighted errors. Names required, phones must be 10 digits."); return; }
      if (validBulkData.length === 0) { customAlert("No valid data to save."); return; }
      processBulkAdd();
    }

    // Keep original validateAndOpenPwModal for backward compatibility (but now unused for employee actions)


    async function processBulkAdd() {
      if (validBulkData.length === 0) throw new Error("Validation Failed");
      try {
        let tempEmployees = [];
        for (let item of validBulkData) {
          let hindiName = await transliterateToHindi(item.name);
          tempEmployees.push({ name: hindiName, phone: item.phone });
        }
        if (tempEmployees.length > 0) {
          const { data, error } = await window.db.from('sample_employees').insert(tempEmployees).select();
          if (error) {
            console.error('❌ Error adding employees:', error);
            customAlert('❌ Error saving to database: ' + error.message);
            return;
          }
          employeeList.push(...(data || tempEmployees));
          renderEmployeeTable();
          setupForm();
          showToast(`✅ Successfully added ${tempEmployees.length} personnel!`);
          console.log('✅ Added ' + tempEmployees.length + ' employees to sample_employees');
        }
        closeBulkModal();
      } catch (err) {
        console.error('❌ Error in processBulkAdd:', err);
        customAlert('❌ Error: ' + err.message);
      }
    }

    // Load sample employees from sample_employees table directly into memory
    async function loadSampleEmployees() {
      try {
        const { data: sampleData, error } = await window.db.from('sample_employees').select('*');
        if (error) {
          console.error('❌ Error loading sample data:', error);
          showToast('❌ Error loading sample data: ' + error.message);
          return;
        }

        if (!sampleData || sampleData.length === 0) {
          showToast('❌ No sample data found in sample_employees table');
          return;
        }

        // Load sample data directly into employeeList (no need to insert to main table)
        employeeList.push(...sampleData);
        renderEmployeeTable();
        setupForm();
        showToast(`✅ Loaded ${sampleData.length} sample employees!`);
        console.log('✅ Loaded ' + sampleData.length + ' sample employees to employee list');
      } catch (err) {
        console.error('❌ Error in loadSampleEmployees:', err);
        showToast('❌ Error: ' + err.message);
      }
    }

    document.addEventListener('input', async (e) => {
      if (e.target.classList.contains('bulk-name-input')) {
        const input = e.target;
        const suggestionsBox = input.nextElementSibling;
        const text = input.value;
        const cursorPosition = input.selectionStart;
        const lastSpaceIndex = text.lastIndexOf(' ', cursorPosition - 1);
        input._currentWordStart = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1;
        const currentWord = text.substring(input._currentWordStart, cursorPosition);
        if (currentWord.trim().length > 0 && /^[a-zA-Z]+$/.test(currentWord)) {
          try {
            const response = await fetch(`https://inputtools.google.com/request?text=${currentWord}&itc=hi-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8`);
            const data = await response.json();
            if (data[0] === 'SUCCESS' && data[1][0] && data[1][0][1]) {
              suggestionsBox.innerHTML = '';
              data[1][0][1].forEach(suggestion => {
                const li = document.createElement('li');
                li.className = 'px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-100 last:border-0 font-semibold';
                li.textContent = suggestion;
                li.onmousedown = (ev) => { ev.preventDefault(); selectBulkSuggestion(input, suggestionsBox, suggestion); };
                suggestionsBox.appendChild(li);
              });
              suggestionsBox.classList.remove('hidden');
            } else { suggestionsBox.classList.add('hidden'); }
          } catch (err) { console.error("Transliteration error:", err); }
        } else { suggestionsBox.classList.add('hidden'); }
      }
    });

    function selectBulkSuggestion(input, suggestionsBox, suggestion) {
      const text = input.value;
      const cursorPosition = input.selectionStart;
      const beforeWord = text.substring(0, input._currentWordStart);
      const afterWord = text.substring(cursorPosition);
      input.value = beforeWord + suggestion + ' ' + afterWord;
      suggestionsBox.classList.add('hidden');
      input.focus();
    }

    document.addEventListener('keydown', (e) => {
      if (e.target.classList.contains('bulk-name-input') && e.key === ' ') {
        const suggestionsBox = e.target.nextElementSibling;
        if (suggestionsBox && !suggestionsBox.classList.contains('hidden') && suggestionsBox.firstChild) {
          e.preventDefault();
          selectBulkSuggestion(e.target, suggestionsBox, suggestionsBox.firstChild.textContent);
        }
      }
    });

    const nameInput = document.getElementById('newName');
    const suggestionsBox = document.getElementById('nameSuggestions');
    let currentWordStart = 0;

    nameInput.addEventListener('input', async (e) => {
      const text = nameInput.value;
      const cursorPosition = nameInput.selectionStart;
      const lastSpaceIndex = text.lastIndexOf(' ', cursorPosition - 1);
      currentWordStart = lastSpaceIndex === -1 ? 0 : lastSpaceIndex + 1;
      const currentWord = text.substring(currentWordStart, cursorPosition);
      if (currentWord.trim().length > 0 && /^[a-zA-Z]+$/.test(currentWord)) {
        try {
          const response = await fetch(`https://inputtools.google.com/request?text=${currentWord}&itc=hi-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8`);
          const data = await response.json();
          if (data[0] === 'SUCCESS' && data[1][0] && data[1][0][1]) showSuggestions(data[1][0][1]);
          else suggestionsBox.classList.add('hidden');
        } catch (err) { console.error("Transliteration error:", err); }
      } else { suggestionsBox.classList.add('hidden'); }
    });

    function showSuggestions(suggestions) {
      suggestionsBox.innerHTML = '';
      suggestions.forEach(suggestion => {
        const li = document.createElement('li');
        li.className = 'px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm border-b border-gray-100 last:border-0 font-semibold';
        li.textContent = suggestion;
        li.onmousedown = (e) => { e.preventDefault(); selectSuggestion(suggestion); };
        suggestionsBox.appendChild(li);
      });
      suggestionsBox.classList.remove('hidden');
    }

    function selectSuggestion(suggestion) {
      const text = nameInput.value;
      const cursorPosition = nameInput.selectionStart;
      const beforeWord = text.substring(0, currentWordStart);
      const afterWord = text.substring(cursorPosition);
      nameInput.value = beforeWord + suggestion + ' ' + afterWord;
      suggestionsBox.classList.add('hidden');
      nameInput.focus();
    }

    nameInput.addEventListener('keydown', (e) => {
      if (e.key === ' ' && !suggestionsBox.classList.contains('hidden')) {
        e.preventDefault();
        const firstSuggestion = suggestionsBox.firstChild.textContent;
        selectSuggestion(firstSuggestion);
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target !== nameInput && e.target !== suggestionsBox) suggestionsBox.classList.add('hidden');
      if (!e.target.classList.contains('bulk-name-input')) {
        document.querySelectorAll('.bulk-name-suggestions').forEach(box => box.classList.add('hidden'));
      }
    });

    function cancelEdit() {
      document.getElementById('newName').value = "";
      document.getElementById('newPhone').value = "";
      document.getElementById('editIndex').value = "";
      document.getElementById('editDbId').value = "";
      document.getElementById('btnText').innerHTML = '<svg class="ui-icon"><use href="#icon-user"></use></svg><svg class="ui-icon"><use href="#icon-plus"></use></svg> Add Record';
      document.getElementById('cancelBtn').classList.add('hidden');
    }


window.employeeList = employeeList;
window.defaultSeedEmployees = defaultSeedEmployees;
window.bulkRowsCount = bulkRowsCount;
window.bulkRowIdCounter = bulkRowIdCounter;
window.validBulkData = validBulkData;
window.renderEmployeeTable = renderEmployeeTable;
window.editEmployeeDirect = editEmployeeDirect;
window.deleteEmployeeDirect = deleteEmployeeDirect;
window.saveEmployeeDirect = saveEmployeeDirect;
window.cancelEdit = cancelEdit;
window.openBulkModal = openBulkModal;
window.closeBulkModal = closeBulkModal;
window.addBulkRow = addBulkRow;
window.removeBulkRow = removeBulkRow;
window.updateSerialNumbers = updateSerialNumbers;
window.processBulkAddDirect = processBulkAddDirect;
window.processBulkAdd = processBulkAdd;
window.loadSampleEmployees = loadSampleEmployees;
window.selectBulkSuggestion = selectBulkSuggestion;
window.showSuggestions = showSuggestions;
window.selectSuggestion = selectSuggestion;
