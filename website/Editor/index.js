let canvas, ctx, fabricCanvas, activeImage, fileHandle;
let history = [];
let historyIndex = -1;

document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
});

async function saveFile() {
    const text = document.getElementById('editor').value;
    if (fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(text);
        await writable.close();
    } else {
        saveAsNewFile();
    }
}

async function saveAsNewFile() {
    const text = document.getElementById('editor').value;
    const options = {
        types: [
            {
                description: 'Text Files',
                accept: {
                    'text/plain': ['.txt'],
                    'text/html': ['.html'],
                    'text/css': ['.css'],
                    'application/javascript': ['.js'],
                },
            },
        ],
    };
    fileHandle = await window.showSaveFilePicker(options);
    const writable = await fileHandle.createWritable();
    await writable.write(text);
    await writable.close();
}

async function loadFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        if (file.type.startsWith('image/')) {
            document.querySelector('.text-toolbar').style.display = 'none';
            document.querySelector('.image-toolbar').style.display = 'flex';
            const img = new Image();
            img.onload = function() {
                document.getElementById('imagePreview').innerHTML = '';
                document.getElementById('imagePreview').appendChild(img);
                setupCanvas(img);
            };
            img.src = e.target.result;
        } else if (file.type.startsWith('audio/')) {
            document.querySelector('.text-toolbar').style.display = 'none';
            document.querySelector('.image-toolbar').style.display = 'none';
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.src = e.target.result;
            document.getElementById('mediaPreview').innerHTML = '';
            document.getElementById('mediaPreview').appendChild(audio);
        } else if (file.type.startsWith('video/')) {
            document.querySelector('.text-toolbar').style.display = 'none';
            document.querySelector('.image-toolbar').style.display = 'none';
            const video = document.createElement('video');
            video.controls = true;
            video.src = e.target.result;
            document.getElementById('mediaPreview').innerHTML = '';
            document.getElementById('mediaPreview').appendChild(video);
        } else {
            document.querySelector('.text-toolbar').style.display = 'flex';
            document.querySelector('.image-toolbar').style.display = 'none';
            document.getElementById('editor').value = e.target.result;
            saveHistory();
        }
    };

    reader.readAsDataURL(file);
}

function applyStyle(style) {
    const editor = document.getElementById('editor');
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    let newText;

    switch (style) {
        case 'bold':
            newText = `<b>${selectedText}</b>`;
            break;
        case 'italic':
            newText = `<i>${selectedText}</i>`;
            break;
        case 'underline':
            newText = `<u>${selectedText}</u>`;
            break;
    }

    editor.setRangeText(newText, start, end, 'end');
    saveHistory();
}

function applyColor() {
    const color = document.getElementById('colorPicker').value;
    const editor = document.getElementById('editor');
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    const newText = `<span style="color:${color};">${selectedText}</span>`;

    editor.setRangeText(newText, start, end, 'end');
    saveHistory();
}

function applyFont() {
    const font = document.getElementById('fontPicker').value;
    const editor = document.getElementById('editor');
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    const newText = `<span style="font-family:${font};">${selectedText}</span>`;

    editor.setRangeText(newText, start, end, 'end');
    saveHistory();
}

function setupCanvas(img) {
    const canvasElement = document.getElementById('imageCanvas');
    canvasElement.style.display = 'block';
    canvasElement.width = img.width;
    canvasElement.height = img.height;
    ctx = canvasElement.getContext('2d');
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height); // Clear the canvas
    ctx.drawImage(img, 0, 0);
    fabricCanvas = new fabric.Canvas('imageCanvas');
    fabric.Image.fromURL(img.src, function(oImg) {
        fabricCanvas.add(oImg);
        activeImage = oImg;
    });
}

function cropImage() {
    if (activeImage) {
        const cropped = new fabric.Image(activeImage.getElement(), {
            left: activeImage.left,
            top: activeImage.top,
            width: activeImage.width / 2,
            height: activeImage.height / 2,
            scaleX: activeImage.scaleX,
            scaleY: activeImage.scaleY
        });
        fabricCanvas.clear();
        fabricCanvas.add(cropped);
        activeImage = cropped;
        updateImagePreview();
        saveHistory();
    }
}

function drawOnImage() {
    fabricCanvas.isDrawingMode = !fabricCanvas.isDrawingMode;
}

function applyFilter(filter) {
    if (activeImage) {
        activeImage.filters.push(new fabric.Image.filtersfilter);
        activeImage.applyFilters();
        fabricCanvas.renderAll();
        updateImagePreview();
        saveHistory();
    }
}

function adjustImage(type, value) {
    if (activeImage) {
        const filterType = fabric.Image.filters[type.charAt(0).toUpperCase() + type.slice(1)];
        const filter = new filterType({ [type]: parseFloat(value) });
        activeImage.filters.push(filter);
        activeImage.applyFilters();
        fabricCanvas.renderAll();
        updateImagePreview();
        saveHistory();
    }
}

function updateImagePreview() {
    const dataUrl = fabricCanvas.toDataURL();
    const img = new Image();
    img.src = dataUrl;
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('imagePreview').appendChild(img);
}

function saveHistory() {
    const editor = document.getElementById('editor');
    if (historyIndex < history.length - 1) {
        history = history.slice(0, historyIndex + 1);
    }
    history.push(editor.value);
    historyIndex++;
    saveToLocalStorage();
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        document.getElementById('editor').value = history[historyIndex];
        saveToLocalStorage();
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        document.getElementById('editor').value = history[historyIndex];
        saveToLocalStorage();
    }
}

function resetEditor() {
    document.getElementById('editor').value = '';
    saveHistory();
}

async function convertImage() {
    const options = {
        types: [
            {
                description: 'Image Files',
                accept: {
                    'image/png': ['.png'],
                    'image/jpeg': ['.jpeg'],
                    'image/webp': ['.webp'],
                },
            },
        ],
    };
    const fileHandle = await window.showSaveFilePicker(options);
    const writable = await fileHandle.createWritable();
    const dataUrl = fabricCanvas.toDataURL();
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    await writable.write(blob);
    await writable.close();
}

async function convertFile() {
    const text = document.getElementById('editor').value;
    const options = {
        types: [
            {
                description: 'Text Files',
                accept: {
                    'text/plain': ['.txt'],
                    'text/html': ['.html'],
                    'text/css': ['.css'],
                    'application/javascript': ['.js'],
                },
            },
        ],
    };
    const fileHandle = await window.showSaveFilePicker(options);
    const writable = await fileHandle.createWritable();
    await writable.write(text);
    await writable.close();
}

function saveToLocalStorage() {
    const editorContent = document.getElementById('editor').value;
    localStorage.setItem('editorContent', editorContent);
    localStorage.setItem('history', JSON.stringify(history));
    localStorage.setItem('historyIndex', historyIndex);
}

function loadFromLocalStorage() {
    const editorContent = localStorage.getItem('editorContent');
    if (editorContent) {
        document.getElementById('editor').value = editorContent;
    }
    const storedHistory = localStorage.getItem('history');
    if (storedHistory) {
        history = JSON.parse(storedHistory);
    }
    const storedHistoryIndex = localStorage.getItem('historyIndex');
    if (storedHistoryIndex) {
        historyIndex = parseInt(storedHistory);
        }
    }