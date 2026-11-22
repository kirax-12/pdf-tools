// PDF Tools — semua proses jalan lokal di browser pakai pdf-lib + PDF.js.
// File yang dipilih user gak pernah dikirim ke mana-mana.

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const { PDFDocument } = PDFLib;

/* ---------- helper umum ---------- */

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function isPdfFile(file) {
  return file.type === "application/pdf" || /\.pdf$/i.test(file.name);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function showMsg(el, text) {
  el.textContent = text;
  el.hidden = !text;
}

function baseName(name) {
  return name.replace(/\.pdf$/i, "");
}

// Sambungkan dropzone ke input file: klik, keyboard, dan drag & drop.
function wireDropzone(zoneId, inputId, onFiles) {
  const zone = document.getElementById(zoneId);
  const input = document.getElementById(inputId);

  zone.addEventListener("click", () => input.click());
  zone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      input.click();
    }
  });
  input.addEventListener("change", () => {
    if (input.files.length) onFiles(Array.from(input.files));
    input.value = "";
  });

  ["dragenter", "dragover"].forEach((ev) =>
    zone.addEventListener(ev, (e) => {
      e.preventDefault();
      zone.classList.add("is-dragging");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    zone.addEventListener(ev, (e) => {
      e.preventDefault();
      zone.classList.remove("is-dragging");
    })
  );
  zone.addEventListener("drop", (e) => {
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) onFiles(files);
  });
}

/* ---------- tabs ---------- */

const tabButtons = document.querySelectorAll(".tab");
tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-selected", b === btn ? "true" : "false");
    });
    document.querySelectorAll(".panel").forEach((p) => {
      const active = p.id === "panel-" + btn.dataset.tab;
      p.classList.toggle("is-active", active);
      p.hidden = !active;
    });
  });
});

/* ---------- TAB 1: GABUNG PDF ---------- */

const mergeState = { files: [] }; // { file, doc, pageCount }
const listGabung = document.getElementById("list-gabung");
const infoGabung = document.getElementById("info-gabung");
const btnGabung = document.getElementById("btn-gabung");
const errGabung = document.getElementById("err-gabung");
const okGabung = document.getElementById("ok-gabung");

function renderMergeList() {
  listGabung.innerHTML = "";
  mergeState.files.forEach((entry, i) => {
    const li = document.createElement("li");

    const num = document.createElement("span");
    num.className = "file-num";
    num.textContent = i + 1;

    const name = document.createElement("span");
    name.className = "file-name";
    name.textContent = entry.file.name;

    const meta = document.createElement("span");
    meta.className = "file-meta";
    meta.textContent = entry.pageCount + " hal · " + formatBytes(entry.file.size);

    const rm = document.createElement("button");
    rm.className = "file-remove";
    rm.textContent = "Hapus";
    rm.setAttribute("aria-label", "Hapus " + entry.file.name);
    rm.addEventListener("click", () => {
      mergeState.files.splice(i, 1);
      renderMergeList();
    });

    li.append(num, name, meta, rm);
    listGabung.appendChild(li);
  });

  const totalPages = mergeState.files.reduce((s, f) => s + f.pageCount, 0);
  infoGabung.textContent = mergeState.files.length
    ? mergeState.files.length + " file · total " + totalPages + " halaman"
    : "Belum ada file.";
  btnGabung.disabled = mergeState.files.length < 2;
  if (mergeState.files.length === 1) {
    infoGabung.textContent += " — tambah minimal satu file lagi buat digabung.";
  }
}

async function addMergeFiles(files) {
  showMsg(errGabung, "");
  showMsg(okGabung, "");
  for (const file of files) {
    if (!isPdfFile(file)) {
      showMsg(errGabung, '"' + file.name + '" bukan file PDF, dilewati ya.');
      continue;
    }
    try {
      const buf = await file.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      mergeState.files.push({ file, doc, pageCount: doc.getPageCount() });
    } catch (e) {
      showMsg(
        errGabung,
        '"' + file.name + '" gak bisa dibuka. Mungkin file-nya rusak atau kepassword.'
      );
    }
  }
  renderMergeList();
}

wireDropzone("dz-gabung", "input-gabung", addMergeFiles);

btnGabung.addEventListener("click", async () => {
  showMsg(errGabung, "");
  showMsg(okGabung, "");
  btnGabung.disabled = true;
  const labelAsli = btnGabung.textContent;
  btnGabung.textContent = "Lagi nggabungin…";
  try {
    const merged = await PDFDocument.create();
    for (const entry of mergeState.files) {
      const pages = await merged.copyPages(
        entry.doc,
        entry.doc.getPageIndices()
      );
      pages.forEach((p) => merged.addPage(p));
    }
    const bytes = await merged.save();
    downloadBlob(
      new Blob([bytes], { type: "application/pdf" }),
      "gabungan.pdf"
    );
    showMsg(
      okGabung,
      "Beres! " +
        mergeState.files.length +
        " file udah jadi satu di gabungan.pdf (" +
        merged.getPageCount() +
        " halaman)."
    );
  } catch (e) {
    showMsg(errGabung, "Gagal nggabungin PDF-nya. Coba cek lagi file-nya, mungkin ada yang rusak.");
  } finally {
    btnGabung.textContent = labelAsli;
    renderMergeList();
  }
});

/* ---------- TAB 2: AMBIL HALAMAN ---------- */

const extractState = { file: null, doc: null, pageCount: 0 };
const infoAmbil = document.getElementById("info-ambil");
const rangeAmbil = document.getElementById("range-ambil");
const btnAmbil = document.getElementById("btn-ambil");
const errAmbil = document.getElementById("err-ambil");
const okAmbil = document.getElementById("ok-ambil");

async function setExtractFile(files) {
  showMsg(errAmbil, "");
  showMsg(okAmbil, "");
  const file = files[0];
  if (!file) return;
  if (!isPdfFile(file)) {
    showMsg(errAmbil, '"' + file.name + '" bukan file PDF. Pilih yang berekstensi .pdf ya.');
    return;
  }
  try {
    const buf = await file.arrayBuffer();
    const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
    extractState.file = file;
    extractState.doc = doc;
    extractState.pageCount = doc.getPageCount();
    infoAmbil.textContent =
      file.name + " · " + extractState.pageCount + " halaman · " + formatBytes(file.size);
    rangeAmbil.disabled = false;
    btnAmbil.disabled = false;
  } catch (e) {
    extractState.file = null;
    extractState.doc = null;
    extractState.pageCount = 0;
    infoAmbil.textContent = "Belum ada file.";
    rangeAmbil.disabled = true;
    btnAmbil.disabled = true;
    showMsg(errAmbil, "File-nya gak bisa dibuka. Mungkin rusak atau kepassword.");
  }
}

wireDropzone("dz-ambil", "input-ambil", setExtractFile);

// Ubah teks kayak "1-3, 5, 8" jadi daftar indeks halaman (0-based, urut, unik).
function parsePageRange(text, totalPages) {
  const result = [];
  const seen = new Set();
  const parts = text.split(",").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) throw new Error("kosong");

  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
    const singleMatch = part.match(/^(\d+)$/);
    let from, to;
    if (rangeMatch) {
      from = parseInt(rangeMatch[1], 10);
      to = parseInt(rangeMatch[2], 10);
    } else if (singleMatch) {
      from = to = parseInt(singleMatch[1], 10);
    } else {
      throw new Error('Format "' + part + '" gak dikenali.');
    }
    if (from < 1 || to > totalPages || from > to) {
      throw new Error(
        "Halaman " + part + " di luar jangkauan. PDF ini cuma punya " + totalPages + " halaman."
      );
    }
    for (let p = from; p <= to; p++) {
      if (!seen.has(p)) {
        seen.add(p);
        result.push(p - 1);
      }
    }
  }
  result.sort((a, b) => a - b);
  return result;
}

btnAmbil.addEventListener("click", async () => {
  showMsg(errAmbil, "");
  showMsg(okAmbil, "");
  if (!extractState.doc) return;

  let indices;
  try {
    indices = parsePageRange(rangeAmbil.value, extractState.pageCount);
  } catch (e) {
    showMsg(errAmbil, e.message + ' Contoh format yang bener: "1-3, 5".');
    return;
  }

  btnAmbil.disabled = true;
  const labelAsli = btnAmbil.textContent;
  btnAmbil.textContent = "Lagi ngambil halaman…";
  try {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(extractState.doc, indices);
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save();
    const name = baseName(extractState.file.name) + "-halaman.pdf";
    downloadBlob(new Blob([bytes], { type: "application/pdf" }), name);
    showMsg(okAmbil, "Beres! " + indices.length + " halaman kesimpen di " + name + ".");
  } catch (e) {
    showMsg(errAmbil, "Gagal ngambil halamannya. Coba lagi ya.");
  } finally {
    btnAmbil.textContent = labelAsli;
    btnAmbil.disabled = false;
  }
});

/* ---------- TAB 3: PDF KE GAMBAR ---------- */

const infoGambar = document.getElementById("info-gambar");
const errGambar = document.getElementById("err-gambar");
const thumbsGambar = document.getElementById("thumbs-gambar");
let thumbUrls = [];

function clearThumbs() {
  thumbUrls.forEach((u) => URL.revokeObjectURL(u));
  thumbUrls = [];
  thumbsGambar.innerHTML = "";
}

async function renderPdfToImages(files) {
  showMsg(errGambar, "");
  const file = files[0];
  if (!file) return;
  if (!isPdfFile(file)) {
    showMsg(errGambar, '"' + file.name + '" bukan file PDF. Pilih yang berekstensi .pdf ya.');
    return;
  }

  clearThumbs();
  infoGambar.textContent = "Lagi buka " + file.name + "…";

  let pdf;
  try {
    const buf = await file.arrayBuffer();
    pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  } catch (e) {
    infoGambar.textContent = "Belum ada file.";
    showMsg(errGambar, "PDF-nya gak bisa dibuka. Mungkin rusak atau kepassword.");
    return;
  }

  const total = pdf.numPages;
  const base = baseName(file.name);

  for (let n = 1; n <= total; n++) {
    infoGambar.textContent =
      file.name + " · lagi render halaman " + n + " dari " + total + "…";
    try {
      const page = await pdf.getPage(n);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport }).promise;

      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      const url = URL.createObjectURL(blob);
      thumbUrls.push(url);

      const fig = document.createElement("figure");
      fig.className = "thumb";

      const img = document.createElement("img");
      img.src = url;
      img.alt = "Halaman " + n + " dari " + file.name;

      const cap = document.createElement("figcaption");
      cap.textContent = "Halaman " + n;

      const dl = document.createElement("a");
      dl.className = "btn btn-small";
      dl.href = url;
      dl.download = base + "-halaman-" + n + ".png";
      dl.textContent = "Download PNG ↓";

      fig.append(img, cap, dl);
      thumbsGambar.appendChild(fig);
    } catch (e) {
      showMsg(errGambar, "Halaman " + n + " gagal di-render, halaman lain tetap lanjut.");
    }
  }

  infoGambar.textContent =
    file.name + " · " + total + " halaman selesai di-render. Klik Download PNG di tiap gambar.";
}

wireDropzone("dz-gambar", "input-gambar", renderPdfToImages);

/* ---------- footer ---------- */

document.getElementById("year").textContent = new Date().getFullYear();
