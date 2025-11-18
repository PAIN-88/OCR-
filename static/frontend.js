let bankFile = null;
let panFile = null;
let bankJSON = null;
let panJSON = null;

// Tab switching
const bankTab = document.getElementById('bankTab');
const panTab = document.getElementById('panTab');
const bankSection = document.getElementById('bankSection');
const panSection = document.getElementById('panSection');

bankTab.addEventListener('click', () => {
    bankTab.classList.add('active-bank');
    panTab.classList.remove('active-pan');
    bankSection.classList.add('active');
    panSection.classList.remove('active');
});

panTab.addEventListener('click', () => {
    panTab.classList.add('active-pan');
    bankTab.classList.remove('active-bank');
    panSection.classList.add('active');
    bankSection.classList.remove('active');
});

// Bank Statement Upload
const bankUploadArea = document.getElementById('bankUploadArea');
const bankFileInput = document.getElementById('bankFileInput');
const bankFilePreview = document.getElementById('bankFilePreview');
const bankFileName = document.getElementById('bankFileName');
const bankFileSize = document.getElementById('bankFileSize');
const bankClearBtn = document.getElementById('bankClearBtn');
const bankSubmitBtn = document.getElementById('bankSubmitBtn');
const bankSuccess = document.getElementById('bankSuccess');
const downloadBankBtn = document.getElementById('downloadBankBtn');

bankUploadArea.addEventListener('click', () => bankFileInput.click());

bankFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        bankFile = file;
        bankFileName.textContent = file.name;
        bankFileSize.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        bankFilePreview.classList.add('show');
        bankSubmitBtn.disabled = false;
        bankSuccess.classList.remove('show');
    } else {
        alert('Please upload a PDF file');
        bankFileInput.value = '';
    }
});

bankClearBtn.addEventListener('click', () => {
    bankFile = null;
    bankFileInput.value = '';
    bankFilePreview.classList.remove('show');
    bankSubmitBtn.disabled = true;
    bankSuccess.classList.remove('show');
});

// SUBMIT BANK FILE - FIXED FOR PRODUCTION
bankSubmitBtn.addEventListener('click', () => {
    if (bankFile) {
        const formData = new FormData();
        formData.append('bankStatement', bankFile);

        // ✅ CHANGED: Use relative URL instead of localhost
        fetch('/upload-bank', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {

            console.log('Backend response:', data);

            // STORE JSON FOR DOWNLOAD
            bankJSON = data;

            // Enable download button
            downloadBankBtn.style.display = "block";

            // UI changes
            bankSuccess.classList.add('show');
            bankSubmitBtn.textContent = 'Uploaded Successfully';

            setTimeout(() => {
                bankFile = null;
                bankFileInput.value = '';
                bankFilePreview.classList.remove('show');
                bankSuccess.classList.remove('show');
                bankSubmitBtn.disabled = true;
                bankSubmitBtn.textContent = 'Submit Bank Statement';
            }, 2000);
        })
        .catch(err => {
            console.error('Upload failed', err);
            alert('Upload failed! Try again.');
        });
    }
});

// DOWNLOAD BANK JSON
downloadBankBtn.addEventListener("click", () => {
    downloadJSON(bankJSON, "bank_statement.json");
});

// PAN Upload
const panUploadArea = document.getElementById('panUploadArea');
const panFileInput = document.getElementById('panFileInput');
const panFilePreview = document.getElementById('panFilePreview');
const panFileName = document.getElementById('panFileName');
const panFileSize = document.getElementById('panFileSize');
const panClearBtn = document.getElementById('panClearBtn');
const panSubmitBtn = document.getElementById('panSubmitBtn');
const panSuccess = document.getElementById('panSuccess');
const downloadPanBtn = document.getElementById('downloadPanBtn');

panUploadArea.addEventListener('click', () => panFileInput.click());

panFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
        panFile = file;
        panFileName.textContent = file.name;
        panFileSize.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        panFilePreview.classList.add('show');
        panSubmitBtn.disabled = false;
        panSuccess.classList.remove('show');
    } else {
        alert('Please upload a PDF or Image');
        panFileInput.value = '';
    }
});

panClearBtn.addEventListener('click', () => {
    panFile = null;
    panFileInput.value = '';
    panFilePreview.classList.remove('show');
    panSubmitBtn.disabled = true;
    panSuccess.classList.remove('show');
});

// SUBMIT PAN FILE - FIXED FOR PRODUCTION
panSubmitBtn.addEventListener('click', () => {
    if (panFile) {
        const formData = new FormData();
        formData.append('panCard', panFile);

        // ✅ CHANGED: Use relative URL instead of localhost
        fetch('/upload-pan', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {

            console.log('Backend response:', data);

            // STORE JSON FOR DOWNLOAD
            panJSON = data;

            // Show button
            downloadPanBtn.style.display = "block";

            panSuccess.classList.add('show');
            panSubmitBtn.textContent = 'Uploaded Successfully';

            setTimeout(() => {
                panFile = null;
                panFileInput.value = '';
                panFilePreview.classList.remove('show');
                panSuccess.classList.remove('show');
                panSubmitBtn.disabled = true;
                panSubmitBtn.textContent = 'Submit PAN Card';
            }, 2000);
        })
        .catch(err => {
            console.error('Upload failed', err);
            alert('Upload failed! Try again.');
        });
    }
});

// DOWNLOAD PAN JSON
downloadPanBtn.addEventListener("click", () => {
    downloadJSON(panJSON, "pan_card.json");
});

// Download JSON Utility
function downloadJSON(jsonData, filename) {
    const jsonStr = JSON.stringify(jsonData, null, 4);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}
