// Event detail page functionality
let currentEvent = null;
let userRegistrations = [];
let selectedRating = 0;

$(document).ready(function() {
    if (!Auth.requireAuth()) return;
    
    const eventId = Utils.getParam('id');
    if (!eventId) {
        Utils.showToast('Event not found', 'error');
        setTimeout(() => window.location.href = 'events.html', 1000);
        return;
    }
    
    loadEventDetails(eventId);
    loadUserRegistrations();
    
    // Rating selection
    $('.star-btn').on('click', function() {
        selectedRating = $(this).data('rating');
        $('#selected-rating').val(selectedRating);
        updateStarDisplay();
    });
    
    // Feedback form
    $('#feedback-form').on('submit', handleFeedbackSubmit);
    
    // Registration handlers
    $('#register-btn').on('click', handleRegister);
    $('#cancel-btn').on('click', handleCancelRegistration);
});

async function loadEventDetails(eventId) {
    try {
        const res = await API.get(`/events/${eventId}`);
        if (res.status === 200 && res.data) {
            currentEvent = res.data;
            renderEventDetails();
            loadFeedback(eventId);
            
            if (Auth.isAdmin()) {
                loadAttendees(eventId);
            }
        } else {
            Utils.showToast('Event not found', 'error');
            setTimeout(() => window.location.href = 'events.html', 1000);
        }
    } catch (err) {
        console.error('Failed to load event:', err);
        Utils.showToast('Failed to load event', 'error');
    }
}

function renderEventDetails() {
    const event = currentEvent;
    const imageUrl = event.metadata?.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200';
    
    $('#event-image').attr('src', imageUrl).attr('alt', event.title);
    $('#event-title').text(event.title);
    $('#event-description').text(event.description || 'No description available');
    $('#event-location').text(event.location || 'TBA');
    $('#event-date').text(Utils.formatDateShort(event.starts_at));
    $('#event-start').text(Utils.formatDate(event.starts_at));
    $('#event-end').text(Utils.formatDate(event.ends_at));
    
    document.title = `${event.title} | CivicEvents+`;
}

async function loadUserRegistrations() {
    try {
        const res = await API.get('/event-registrations/my-registrations');
        if (res.status === 200 && res.data) {
            userRegistrations = res.data;
            updateRegistrationUI();
        }
    } catch (err) {
        console.error('Failed to load registrations:', err);
    }
}

function updateRegistrationUI() {
    const eventId = Utils.getParam('id');
    const registration = userRegistrations.find(r => r.event_id === eventId && r.status === 'registered');
    
    if (registration) {
        $('#register-btn').addClass('hidden');
        $('#cancel-btn').removeClass('hidden');
        $('#registered-badge').removeClass('hidden');
    } else {
        $('#register-btn').removeClass('hidden');
        $('#cancel-btn').addClass('hidden');
        $('#registered-badge').addClass('hidden');
    }
    
    // Show feedback form if registered
    if (registration) {
        $('#feedback-form').removeClass('hidden');
    }
}

async function handleRegister() {
    const eventId = Utils.getParam('id');
    
    try {
        const res = await API.post('/event-registrations/register', { event_id: eventId });
        if (res.status === 201) {
            Utils.showToast('Successfully registered for event!', 'success');
            loadUserRegistrations();
        } else {
            Utils.showToast(res.message || 'Registration failed', 'error');
        }
    } catch (err) {
        Utils.showToast('Failed to register', 'error');
    }
}

async function handleCancelRegistration() {
    const eventId = Utils.getParam('id');
    
    if (!confirm('Are you sure you want to cancel your registration?')) return;
    
    try {
        const res = await API.post('/event-registrations/cancel', { event_id: eventId });
        if (res.status === 200) {
            Utils.showToast('Registration cancelled', 'success');
            loadUserRegistrations();
        } else {
            Utils.showToast(res.message || 'Failed to cancel', 'error');
        }
    } catch (err) {
        Utils.showToast('Failed to cancel registration', 'error');
    }
}

async function loadAttendees(eventId) {
    try {
        const res = await API.get(`/event-registrations/event/${eventId}/attendees`);
        if (res.status === 200 && res.data) {
            renderAttendees(res.data);
        }
    } catch (err) {
        console.error('Failed to load attendees:', err);
    }
}

function renderAttendees(attendees) {
    $('#attendees-section').removeClass('hidden');
    
    if (attendees.length === 0) {
        $('#attendees-list').html('<p class="text-white/50">No registrations yet</p>');
        return;
    }
    
    const html = attendees.map(a => `
        <div class="flex items-center gap-3 p-3 bg-dark-100 rounded-xl">
            <div class="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
                <span class="text-sm font-bold">${a.full_name.charAt(0).toUpperCase()}</span>
            </div>
            <div>
                <p class="font-medium">${a.full_name}</p>
                <p class="text-sm text-white/50">${a.email}</p>
            </div>
            <span class="ml-auto px-3 py-1 bg-success/20 text-success text-xs rounded-full">${a.status}</span>
        </div>
    `).join('');
    
    $('#attendees-list').html(html);
}

async function loadFeedback(eventId) {
    // For admin, load all feedback for this event
    if (Auth.isAdmin()) {
        try {
            const res = await API.get(`/event-feedback/event/${eventId}`);
            if (res.status === 200 && res.data) {
                renderFeedback(res.data);
            }
        } catch (err) {
            console.error('Failed to load feedback:', err);
        }
    } else {
        // For users, we show general feedback (would need a public endpoint)
        // For now, show empty state
        renderFeedback([]);
    }
}

function renderFeedback(feedbacks) {
    const avg = Utils.calculateAverage(feedbacks);
    $('#avg-rating').text(avg);
    $('#avg-stars').html(Utils.renderStars(Math.round(avg)));
    $('#feedback-count').text(`(${feedbacks.length} reviews)`);
    
    if (feedbacks.length === 0) {
        $('#feedback-list').html('<p class="text-center text-white/50 py-8">No reviews yet. Be the first to share your experience!</p>');
        return;
    }
    
    const html = feedbacks.map(f => `
        <div class="p-4 bg-dark-100 rounded-xl">
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <span class="text-sm font-bold">${(f.full_name || 'User').charAt(0).toUpperCase()}</span>
                </div>
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                        <p class="font-medium">${f.full_name || 'Anonymous'}</p>
                        <div class="flex">${Utils.renderStars(f.rating)}</div>
                    </div>
                    <p class="text-white/70 text-sm">${f.comment || 'No comment'}</p>
                    <p class="text-white/30 text-xs mt-2">${Utils.formatDate(f.created_at)}</p>
                </div>
            </div>
        </div>
    `).join('');
    
    $('#feedback-list').html(html);
}

function updateStarDisplay() {
    $('.star-btn').each(function() {
        const rating = $(this).data('rating');
        if (rating <= selectedRating) {
            $(this).removeClass('text-white/30').addClass('text-accent');
        } else {
            $(this).removeClass('text-accent').addClass('text-white/30');
        }
    });
}

async function handleFeedbackSubmit(e) {
    e.preventDefault();
    
    if (selectedRating === 0) {
        Utils.showToast('Please select a rating', 'warning');
        return;
    }
    
    const eventId = Utils.getParam('id');
    const comment = $('#feedback-comment').val().trim();
    
    try {
        const res = await API.post('/event-feedback', {
            event_id: eventId,
            rating: selectedRating,
            comment: comment
        });
        
        if (res.status === 201) {
            Utils.showToast('Feedback submitted!', 'success');
            $('#feedback-comment').val('');
            selectedRating = 0;
            updateStarDisplay();
            loadFeedback(eventId);
        } else {
            Utils.showToast(res.message || 'Failed to submit feedback', 'error');
        }
    } catch (err) {
        Utils.showToast('Failed to submit feedback', 'error');
    }
}