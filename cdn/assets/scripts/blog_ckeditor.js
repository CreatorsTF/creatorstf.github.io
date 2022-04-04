ClassicEditor
    .create(document.getElementById('ck-editor'), {
        config: {
            height: '10rem'
        },
        ckfinder: {
            uploadUrl: '/libraries/ckfinder/index.php?command=QuickUpload&type=Images&responseType=json',
        },
        toolbar: {
            items: [
                // 'heading', 'fontFamily', 'bold', 'italic', 'underline', 'highlight',
                'heading', 'bold', 'italic',
                // '|', 'bulletedList', 'numberedList', 'todoList', 'horizontalLine', 'outdent', 'indent',
                '|', 'bulletedList', 'numberedList', 'outdent', 'indent',
                '|', 'undo', 'redo',
                // '|', 'insertTable', 'imageUpload', 'mediaEmbed', 'htmlEmbed', 'CKFinder'
                '|', 'insertTable', 'imageUpload', 'mediaEmbed', 'CKFinder'
            ]
        },
        language: 'en',
        image: {
            toolbar: [
                'imageTextAlternative',
                'imageStyle:full',
                'imageStyle:side'
            ]
        },
        table: {
            contentToolbar: [
                'tableColumn',
                'tableRow',
                'mergeTableCells'
            ]
        },
        licenseKey: '',
    })
    .then(editor => {
        window.editor = editor;
    })
    .catch(error => {
    });
