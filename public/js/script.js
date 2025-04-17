// Khởi tạo các biến global
let overlay;
let progressContainer;
let progressList;
let modalTitle, modalBody, contentModal;

$(document).ready(function() {
    // Load danh sách interviews
    loadInterviews();

    // Khởi tạo overlay
    overlay = $('<div>')
        .addClass('processing-overlay')
        .css({
            'position': 'fixed',
            'top': 0,
            'left': 0,
            'width': '100%',
            'height': '100%',
            'background': 'rgba(0, 0, 0, 0.5)',
            'z-index': 999,
            'display': 'none'
        })
        .appendTo('body');

    // Khởi tạo progress container
    progressContainer = $('<div>')
        .addClass('progress-container')
        .css({
            'position': 'fixed',
            'top': '50%',
            'left': '50%',
            'transform': 'translate(-50%, -50%)',
            'background': 'white',
            'padding': '20px',
            'border-radius': '8px',
            'box-shadow': '0 2px 10px rgba(0,0,0,0.1)',
            'z-index': 1000,
            'display': 'none',
            'min-width': '300px'
        })
        .appendTo('body');

    const progressTitle = $('<h4>')
        .text('Đang xử lý...')
        .appendTo(progressContainer);

    progressList = $('<ul>')
        .addClass('list-unstyled')
        .css({
            'margin-bottom': '0'
        })
        .appendTo(progressContainer);

    // Khởi tạo modal cho CV và JD
    contentModal = $('<div>')
        .addClass('modal fade')
        .attr('id', 'contentModal')
        .appendTo('body');

    const modalDialog = $('<div>')
        .addClass('modal-dialog modal-lg')
        .appendTo(contentModal);

    const modalContent = $('<div>')
        .addClass('modal-content')
        .appendTo(modalDialog);

    const modalHeader = $('<div>')
        .addClass('modal-header')
        .appendTo(modalContent);

    modalTitle = $('<h5>')
        .addClass('modal-title')
        .appendTo(modalHeader);

    const closeButton = $('<button>')
        .addClass('btn-close')
        .attr('data-bs-dismiss', 'modal')
        .attr('title', 'Đóng')
        .appendTo(modalHeader);

    modalBody = $('<div>')
        .addClass('modal-body')
        .css('max-height', '70vh')
        .css('overflow-y', 'auto')
        .appendTo(modalContent);

    // Thêm modal footer
    const modalFooter = $('<div>')
        .addClass('modal-footer')
        .appendTo(modalContent);

    // Thêm nút download vào footer
    const downloadBtn = $('<button>')
        .addClass('btn btn-primary download-btn d-none')
        .html('<i class="bi bi-download"></i> Tải xuống PDF')
        .appendTo(modalFooter);

    // Thêm nút đóng vào footer
    const closeBtn = $('<button>')
        .addClass('btn btn-secondary')
        .attr('data-bs-dismiss', 'modal')
        .text('Đóng')
        .appendTo(modalFooter);

    // Định nghĩa danh sách giọng đọc OpenAI
    const voices = {
        male: [
            { id: 'echo', name: 'echo (giọng nam trẻ)' },
            { id: 'onyx', name: 'onyx (giọng nam trưởng thành)' }
        ],
        female: [
            { id: 'nova', name: 'nova (giọng nữ trưởng thành)' },
            { id: 'fable', name: 'fable (giọng nữ trẻ)' },
            { id: 'shimmer', name: 'shimmer (giọng nữ dịu dàng)' }
        ],
        neutral: [
            { id: 'alloy', name: 'alloy (giọng trung tính)' }
        ]
    };

    // Cập nhật danh sách giọng đọc dựa trên giới tính
    function updateVoiceOptions(genderSelect, voiceSelect) {
        const gender = genderSelect.value;
        let voiceOptions = [...voices[gender]];

        // Thêm giọng trung tính vào danh sách
        voiceOptions = [...voiceOptions, ...voices.neutral];

        // Xóa tất cả options cũ
        voiceSelect.innerHTML = '<option value="" disabled selected>Chọn giọng đọc</option>';

        // Thêm options mới
        voiceOptions.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.id;
            option.textContent = voice.name;
            voiceSelect.appendChild(option);
        });
    }

    // Thêm event listeners cho giới tính
    $('#candidateGender').on('change', function() {
        updateVoiceOptions(this, document.getElementById('candidateVoice'));
    });

    $('#interviewerGender').on('change', function() {
        updateVoiceOptions(this, document.getElementById('interviewerVoice'));
    });

    // Khởi tạo ban đầu
    updateVoiceOptions(
        document.getElementById('candidateGender'),
        document.getElementById('candidateVoice')
    );
    updateVoiceOptions(
        document.getElementById('interviewerGender'),
        document.getElementById('interviewerVoice')
    );

    // Khởi tạo validation cho form
    const $form = $('#interviewForm');
    $form.validate({
        // Cấu hình hiển thị lỗi
        errorElement: 'div',
        errorPlacement: function(error, element) {
            error.addClass('invalid-feedback');
            error.insertAfter(element);
        },
        highlight: function(element, errorClass, validClass) {
            $(element).addClass('is-invalid').removeClass('is-valid');
        },
        unhighlight: function(element, errorClass, validClass) {
            $(element).removeClass('is-invalid').addClass('is-valid');
        },
        // Quy tắc validate
        rules: {
            // Thông tin ứng viên
            'candidate.name': {
                required: true,
                minlength: 2
            },
            'candidate.email': {
                required: true,
                email: true
            },
            'candidate.phone': {
                required: true,
                pattern: /^[0-9]{10,11}$/
            },
            'candidate.level': 'required',
            'candidate.experienceYears': {
                required: true,
                min: 0
            },
            'candidate.gender': 'required',
            'candidate.voice': {
                required: true,
                differentVoice: true
            },
            // Thông tin vị trí
            'position.title': 'required',
            'position.level': 'required',
            'position.experienceYears': {
                required: true,
                min: 0
            },
            'position.requiredExperience': {
                required: true,
                minlength: 10
            },
            // Thông tin người phỏng vấn
            'interviewer.name': {
                required: true,
                minlength: 2
            },
            'interviewer.gender': 'required',
            'interviewer.position': {
                required: true,
                minlength: 2
            },
            'interviewer.voice': {
                required: true,
                differentVoice: true
            }
        },
        // Thông báo lỗi tùy chỉnh
        messages: {
            // Thông tin ứng viên
            'candidate.name': {
                required: 'Vui lòng nhập tên ứng viên',
                minlength: 'Tên phải có ít nhất {0} ký tự'
            },
            'candidate.email': {
                required: 'Vui lòng nhập email',
                email: 'Vui lòng nhập email hợp lệ'
            },
            'candidate.phone': {
                required: 'Vui lòng nhập số điện thoại',
                pattern: 'Số điện thoại phải có 10-11 chữ số'
            },
            'candidate.level': 'Vui lòng chọn level ứng viên',
            'candidate.experienceYears': {
                required: 'Vui lòng chọn số năm kinh nghiệm',
                min: 'Số năm kinh nghiệm không được âm'
            },
            'candidate.gender': 'Vui lòng chọn giới tính ứng viên',
            'candidate.voice': {
                required: 'Vui lòng chọn giọng đọc cho ứng viên',
                differentVoice: 'Giọng đọc không được trùng với người phỏng vấn'
            },
            // Thông tin vị trí
            'position.title': 'Vui lòng chọn vị trí tuyển dụng',
            'position.level': 'Vui lòng chọn level vị trí',
            'position.experienceYears': {
                required: 'Vui lòng chọn số năm kinh nghiệm yêu cầu',
                min: 'Số năm kinh nghiệm không được âm'
            },
            'position.requiredExperience': {
                required: 'Vui lòng nhập yêu cầu kinh nghiệm',
                minlength: 'Yêu cầu kinh nghiệm phải có ít nhất {0} ký tự'
            },
            // Thông tin người phỏng vấn
            'interviewer.name': {
                required: 'Vui lòng nhập tên người phỏng vấn',
                minlength: 'Tên phải có ít nhất {0} ký tự'
            },
            'interviewer.gender': 'Vui lòng chọn giới tính người phỏng vấn',
            'interviewer.position': {
                required: 'Vui lòng nhập chức vụ người phỏng vấn',
                minlength: 'Chức vụ phải có ít nhất {0} ký tự'
            },
            'interviewer.voice': {
                required: 'Vui lòng chọn giọng đọc cho người phỏng vấn',
                differentVoice: 'Giọng đọc không được trùng với ứng viên'
            }
        },
        // Xử lý khi form hợp lệ
        submitHandler: function(form) {
        const formData = {
            candidate: {},
            position: {},
            interviewer: {}
        };

        // Thu thập dữ liệu từ form
        $('input[name^="candidate."], select[name^="candidate."]').each(function() {
            const name = $(this).attr('name').split('.')[1];
            formData.candidate[name] = $(this).val();
        });

        $('select[name^="position."], textarea[name^="position."]').each(function() {
            const name = $(this).attr('name').split('.')[1];
            formData.position[name] = $(this).val();
        });

        $('input[name^="interviewer."], select[name^="interviewer."]').each(function() {
            const name = $(this).attr('name').split('.')[1];
            formData.interviewer[name] = $(this).val();
        });

            // Hiển thị overlay và progress
            overlay.show();
            progressContainer.show();
            progressList.empty();

            // Kết nối SSE và gửi request
        const eventSource = new EventSource('/api/interviews/progress');

        eventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            console.log('Progress:', data);

            // Tìm hoặc tạo progress item
            let progressItem = progressList.find(`[data-step="${data.step}"]`);
            if (!progressItem.length) {
                progressItem = $('<li>')
                    .attr('data-step', data.step)
                    .appendTo(progressList);
            }

            // Cập nhật trạng thái và icon
            let statusIcon = '⏳';
            if (data.status === 'done') {
                statusIcon = '✅';
            } else if (data.status === 'error') {
                statusIcon = '❌';
            }

            // Thêm icon hourglass cho các bước đang xử lý
            if (data.step === 'conversation' && data.status === 'start') {
                progressItem.html(`⏳ ${data.message}`);
            } else if (data.step === 'conversation' && data.status === 'done') {
                progressItem.html(`✅ ${data.message}`);
            } else {
                progressItem.html(`${statusIcon} ${data.message}`);
            }

            // Nếu có lỗi hoặc hoàn thành, ẩn overlay
            if (data.status === 'error' || (data.step === 'save' && data.status === 'done')) {
                setTimeout(() => {
                    overlay.hide();
                    progressContainer.hide();
                    if (data.status === 'done') {
                        loadInterviews();
                    }
                    eventSource.close();
                }, 1000);
            }
        };

        // Gửi request tạo mô phỏng
        $.ajax({
            url: '/api/interviews',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                console.log('Interview created:', response);
            },
            error: function(xhr) {
                progressContainer.hide();
                eventSource.close();
                alert('Có lỗi xảy ra: ' + xhr.responseJSON?.error || 'Lỗi không xác định');
            }
        });

            return false; // Ngăn form submit theo cách thông thường
        }
    });

    // Thêm custom validation method cho giọng đọc
    $.validator.addMethod('differentVoice', function(value, element) {
        const otherVoice = element.name.includes('candidate') ?
            $('#interviewerVoice').val() :
            $('#candidateVoice').val();
        return !value || !otherVoice || value !== otherVoice;
    }, 'Giọng đọc không được trùng nhau');

    // Xử lý sự kiện filter
    $('#candidateNameFilter, #candidatePhoneFilter, #interviewerNameFilter').on('input', function() {
        loadInterviews();
    });

    // Xử lý sự kiện đóng modal conversation
    $('#conversationModal').on('hidden.bs.modal', function () {
        const audio = $('#conversationAudio')[0];
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    });

    // Xử lý sự kiện audio
    $('#conversationAudio').on('timeupdate', function() {
        const currentTime = Math.floor(this.currentTime * 1000); // Chuyển từ giây sang mili giây và làm tròn xuống
        $('.conversation-item').removeClass('active');

        const currentItem = $('.conversation-item').filter(function() {
            const startTime = parseInt($(this).data('start-time'));
            const endTime = parseInt($(this).data('end-time'));
            return currentTime >= startTime && currentTime < endTime;
        });

        currentItem.addClass('active');
        if (currentItem.length) {
            currentItem[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    // Xử lý sự kiện nút Gen bằng AI
    $('#copyRequiredExperience').click(function() {
        const positionTitle = $('#positionTitle').val();
        const positionLevel = $('#positionLevel').val();
        const positionExperience = $('#positionExperience').val();

        if (!positionTitle || !positionLevel || !positionExperience) {
            alert('Vui lòng điền đầy đủ thông tin vị trí tuyển dụng');
            return;
        }

        overlay.show();
        progressContainer.show();
        progressList.empty();
        progressList.append($('<li>').text('Đang tạo yêu cầu kinh nghiệm...'));

        $.ajax({
            url: '/api/interviews/generate-required-experience',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                positionTitle,
                positionLevel,
                positionExperience
            }),
            success: function(response) {
                $('#positionRequiredExperience').val(response.requiredExperience);
                progressList.find('li').text('Đã tạo xong yêu cầu kinh nghiệm!');
                setTimeout(() => {
                    overlay.hide();
                    progressContainer.hide();
                }, 1000);
            },
            error: function(xhr) {
                progressList.find('li').text('Có lỗi xảy ra: ' + (xhr.responseJSON?.error || 'Lỗi không xác định'));
                setTimeout(() => {
                    overlay.hide();
                    progressContainer.hide();
                }, 2000);
            }
        });
    });
});

function loadInterviews() {
    const filters = {
        candidateName: $('#candidateNameFilter').val(),
        candidatePhone: $('#candidatePhoneFilter').val(),
        interviewerName: $('#interviewerNameFilter').val()
    };

    $.ajax({
        url: '/api/interviews',
        method: 'GET',
        data: filters,
        success: function(interviews) {
            const tbody = $('#interviewTableBody');
            tbody.empty();

            interviews.forEach(function(interview) {
                const row = $('<tr>');
                row.append($('<td>').text(interview.id));
                row.append($('<td>').text(interview.candidate.name));
                row.append($('<td>').text(interview.candidate.phone));
                row.append($('<td>').text(interview.position.title));
                row.append($('<td>').text(interview.interviewer.name));
                row.append($('<td>').text(new Date(interview.createdAt).toLocaleString()));

                const actions = $('<td>');
                actions.append($('<button>')
                    .addClass('btn btn-sm btn-primary me-1')
                    .text('Xem CV')
                    .click(function() {
                        showContent(interview.cv, 'CV của ' + interview.candidate.name, interview, 'cv');
                    }));
                actions.append($('<button>')
                    .addClass('btn btn-sm btn-success me-1')
                    .text('Xem JD')
                    .click(function() {
                        showContent(interview.jd, 'JD vị trí ' + interview.position.title, interview, 'jd');
                    }));
                actions.append($('<button>')
                    .addClass('btn btn-sm btn-info me-1')
                    .text('Xem hội thoại')
                    .click(function() {
                        showConversation(interview);
                    }));
                actions.append($('<button>')
                    .addClass('btn btn-sm btn-danger')
                    .text('Xóa')
                    .click(function() {
                        deleteInterview(interview.id);
                    }));
                row.append(actions);

                tbody.append(row);
            });
        }
    });
}

function showConversation(interview) {
    const modal = $('#conversationModal');
    const audio = $('#conversationAudio')[0];
    const content = $('#conversationContent');

    // Reset audio state
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }

    // Cập nhật source audio
    $('#conversationAudio').attr('src', interview.audioPath);
    content.empty();

    if (interview.conversation) {
        // Thêm CSS cho class active
        if (!$('#conversation-styles').length) {
            $('<style id="conversation-styles">')
                .text(`
                    .conversation-item {
                        padding: 10px;
                        margin: 5px 0;
                        border-radius: 5px;
                        transition: background-color 0.3s ease;
                    }
                    .conversation-item.interviewer {
                        background-color: #f0f0f0;
                    }
                    .conversation-item.candidate {
                        background-color: #e6f7ff;
                    }
                    .conversation-item.active {
                        background-color: #ffd700;
                        font-weight: bold;
                    }
                `)
                .appendTo('head');
        }

        interview.conversation.forEach(function(item) {
            const div = $('<div>')
                .addClass('conversation-item ' + item.speaker)
                .text(item.text)
                .data('start-time', parseInt(item.timeFrom))
                .data('end-time', parseInt(item.timeTo));
            content.append(div);
        });
    }

    // Hiển thị modal
    modal.modal('show');

    // Xử lý sự kiện khi modal đã hiển thị hoàn toàn
    modal.on('shown.bs.modal', function () {
        // Đảm bảo audio đã load xong
        audio.load();
        // Đăng ký sự kiện canplaythrough
        audio.addEventListener('canplaythrough', function onCanPlay() {
            audio.play().catch(function(error) {
                console.log('Auto-play was prevented:', error);
            });
            // Xóa event listener sau khi đã xử lý
            audio.removeEventListener('canplaythrough', onCanPlay);
        });

        // Thêm sự kiện timeupdate để highlight đoạn hội thoại đang active
        audio.addEventListener('timeupdate', function() {
            const currentTimeMs = Math.round(audio.currentTime * 1000); // Chuyển đổi currentTime sang mili giây
            content.find('.conversation-item').each(function() {
                const startTime = parseInt($(this).data('start-time'));
                const endTime = parseInt($(this).data('end-time'));

                if (currentTimeMs >= startTime && currentTimeMs <= endTime) {
                    $(this).addClass('active');
                } else {
                    $(this).removeClass('active');
                }
            });
        });
    });

    // Xử lý sự kiện khi modal bắt đầu đóng
    modal.on('hide.bs.modal', function () {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    });
}

function deleteInterview(id) {
    if (!confirm('Bạn có chắc chắn muốn xóa cuộc phỏng vấn này?')) {
        return;
    }

    overlay.show();
    progressContainer.show();
    progressList.empty();
    progressList.append($('<li>').text('Đang xóa cuộc phỏng vấn...'));

    $.ajax({
        url: `/api/interviews/${id}`,
        method: 'DELETE',
        success: function() {
            progressList.find('li').text('Đã xóa cuộc phỏng vấn thành công!');
            setTimeout(() => {
                overlay.hide();
                progressContainer.hide();
                loadInterviews();
            }, 1000);
        },
        error: function(xhr) {
            progressList.find('li').text('Có lỗi xảy ra: ' + (xhr.responseJSON?.error || 'Lỗi không xác định'));
            setTimeout(() => {
                overlay.hide();
                progressContainer.hide();
            }, 2000);
        }
    });
}

function showLoading() {
    if ($('.loading').length === 0) {
        const loading = $('<div>').addClass('loading');
        const spinner = $('<div>').addClass('loading-spinner');
        loading.append(spinner);
        $('body').append(loading);
    }
}

function hideLoading() {
    $('.loading').remove();
}

function showContent(content, title, interview, type) {
    if (!content) {
        alert('Không có nội dung để hiển thị');
        return;
    }

    // Thêm CSS cho markdown content
    if (!$('#markdown-styles').length) {
        $('<style id="markdown-styles">')
            .text(`
                .markdown-content {
                    font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;
                    line-height: 1.6;
                    padding: 20px;
                    background-color: white;
                }
                .markdown-content h1 { font-size: 2em; margin-bottom: 0.5em; }
                .markdown-content h2 { font-size: 1.5em; margin-bottom: 0.5em; }
                .markdown-content h3 { font-size: 1.3em; margin-bottom: 0.5em; }
                .markdown-content ul, .markdown-content ol { padding-left: 2em; margin-bottom: 1em; }
                .markdown-content li { margin-bottom: 0.3em; }
                .markdown-content p { margin-bottom: 1em; }
                .markdown-content code {
                    background-color: rgba(27,31,35,0.05);
                    border-radius: 3px;
                    padding: 0.2em 0.4em;
                    font-family: SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace;
                }
                .markdown-content pre {
                    background-color: #f6f8fa;
                    border-radius: 3px;
                    padding: 16px;
                    overflow: auto;
                }
                .markdown-content blockquote {
                    border-left: 4px solid #dfe2e5;
                    color: #6a737d;
                    padding: 0 1em;
                    margin: 0 0 1em;
                }
            `)
            .appendTo('head');
    }

    // Cập nhật tiêu đề modal
    modalTitle.text(title);

    // Tạo container cho nội dung
    const contentContainer = $('<div>')
            .addClass('markdown-content')
        .attr('id', 'pdfContent')
        .html(marked.parse(content));

    // Thêm vào modal body
    modalBody.empty().append(contentContainer);

    // Cập nhật nút download
    const downloadBtn = contentModal.find('.download-btn')
        .removeClass('d-none')
        .off('click')
        .click(() => downloadPDF(type, title));

    const modal = new bootstrap.Modal(contentModal);
    modal.show();
}

function downloadPDF(type, title) {
    const element = document.getElementById('pdfContent');

    // Hiển thị loading
    showLoading();

    // Tạo PDF từ nội dung HTML
    html2canvas(element, {
        scale: 2, // Tăng độ phân giải
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff' // Đảm bảo nền trắng
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');

        // Khởi tạo jsPDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');

        // Tính toán kích thước để fit vào trang A4
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = canvas.height * imgWidth / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;

        // Thêm trang đầu tiên
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Thêm các trang tiếp theo nếu cần
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        // Tải xuống PDF
        pdf.save(`${type === 'cv' ? 'CV' : 'JD'}_${title.replace(/[^a-z0-9]/gi, '_')}.pdf`);

        // Ẩn loading
        hideLoading();
    }).catch(error => {
        console.error('Lỗi khi tạo PDF:', error);
        alert('Có lỗi xảy ra khi tạo PDF. Vui lòng thử lại.');
        hideLoading();
    });
}
