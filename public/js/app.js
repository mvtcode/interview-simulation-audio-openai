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

    // Xử lý sự kiện tạo mô phỏng
    $('#generateBtn').click(function() {
        overlay.show(); // Hiển thị overlay
        progressContainer.show();
        progressList.empty();

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

        console.log('Form data:', formData);

        // Kết nối SSE
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
    });

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

    // Chuyển đổi markdown sang HTML và hiển thị trong modal
    modalBody.empty().append(
        $('<div>')
            .addClass('markdown-content')
            .html(marked.parse(content))
    );

    // Cập nhật nút download
    const downloadBtn = contentModal.find('.download-btn')
        .removeClass('d-none')
        .off('click')
        .click(() => downloadPDF(interview.id, type, interview));

    const modal = new bootstrap.Modal(contentModal);
    modal.show();
}

function downloadPDF(interviewId, type, interview) {
    // Lấy đường dẫn file PDF từ interview object
    const filePath = type === 'cv' ? interview.cvPath : interview.jdPath;
    if (!filePath) {
        alert('Không tìm thấy file PDF');
        return;
    }

    // Tạo URL để tải file
    const url = filePath;
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'cv' ? 'cv.pdf' : 'jd.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
