// Events page functionality
let allEvents = [];

$(document).ready(function() {
    if (!Auth.requireAuth()) return;
    
    // Show admin controls
    if (Auth.isAdmin()) {
        $('#create-event-btn').removeClass('hidden').addClass('flex');
    }
    
    loadEvents();
    
    // Search and filters
    $('#search-input').on('input', Utils.debounce(filterEvents, 300));
    $('#location-filter').on('input', Utils.debounce(filterEvents, 300));
    $('#date-filter').on('change', filterEvents);
    $('#clear-filters').on('click', clearFilters);
    
    // Modal handlers
    $('#create-event-btn').on('click', () => openModal());
    $('#close-modal, #modal-backdrop').on('click', closeModal);
    
    // Image preview
    $('#event-image').on('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                $('#preview-img').attr('src', e.target.result);
                $('#image-preview').removeClass('hidden');
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Form submission
    $('#event-form').on('submit', handleEventSubmit);
});

async function loadEvents() {
    try {
        const res = await API.get('/events');
        if (res.status === 200 && res.data) {
            allEvents = res.data;
            renderEvents(allEvents);
        }
    } catch (err) {
        console.error('Failed to load events:', err);
        $('#events-grid').html('<p class="col-span-full text-center text-white/50">Failed to load events</p>');
    }
}

function renderEvents(events) {
    if (events.length === 0) {
        $('#events-grid').addClass('hidden');
        $('#empty-state').removeClass('hidden');
        return;
    }
    
    $('#events-grid').removeClass('hidden');
    $('#empty-state').addClass('hidden');
    
    const isAdmin = Auth.isAdmin();
    
    const html = events.map(event => {
        const imageUrl = event.metadata?.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';
        const startDate = new Date(event.starts_at);
        
        return `
            <div class="group relative overflow-hidden rounded-2xl card-hover glass">
                <a href="event-detail.html?id=${event.id}" class="block">
                    <div class="aspect-video relative overflow-hidden">
                        <img src="${imageUrl}" alt="${event.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div class="absolute top-4 left-4 px-3 py-1 bg-primary rounded-full text-sm font-medium">
                            ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                    </div>
                    <div class="p-5">
                        <h3 class="text-lg font-semibold mb-2 line-clamp-1">${event.title}</h3>
                        <p class="text-white/50 text-sm line-clamp-2 mb-3">${event.description || 'No description available'}</p>
                        <div class="flex items-center gap-2 text-white/60 text-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            <span class="truncate">${event.location || 'TBA'}</span>
                        </div>
                        <div class="flex items-center gap-2 text-white/60 text-sm mt-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            <span>${startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </a>
                ${isAdmin ? `
                    <div class="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="edit-event p-2 glass rounded-lg hover:bg-primary/20" data-id="${event.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button class="delete-event p-2 glass rounded-lg hover:bg-danger/20 text-danger" data-id="${event.id}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    $('#events-grid').html(html);
    
    // Edit handlers
    $('.edit-event').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        const event = allEvents.find(ev => ev.id === id);
        if (event) openModal(event);
    });
    
    // Delete handlers
    $('.delete-event').on('click', async function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        
        if (confirm('Are you sure you want to delete this event?')) {
            try {
                const res = await API.delete(`/events/${id}`);
                if (res.status === 200) {
                    Utils.showToast('Event deleted successfully', 'success');
                    loadEvents();
                } else {
                    Utils.showToast(res.message || 'Failed to delete event', 'error');
                }
            } catch (err) {
                Utils.showToast('Failed to delete event', 'error');
            }
        }
    });
}

function filterEvents() {
    const search = $('#search-input').val().toLowerCase();
    const location = $('#location-filter').val().toLowerCase();
    const date = $('#date-filter').val();
    
    let filtered = allEvents.filter(event => {
        const matchSearch = !search || 
            event.title.toLowerCase().includes(search) || 
            (event.description && event.description.toLowerCase().includes(search));
        const matchLocation = !location || 
            (event.location && event.location.toLowerCase().includes(location));
        const matchDate = !date || 
            new Date(event.starts_at).toDateString() === new Date(date).toDateString();
        
        return matchSearch && matchLocation && matchDate;
    });
    
    renderEvents(filtered);
}

function clearFilters() {
    $('#search-input').val('');
    $('#location-filter').val('');
    $('#date-filter').val('');
    renderEvents(allEvents);
}

function openModal(event = null) {
    $('#event-modal').removeClass('hidden');
    
    if (event) {
        $('#modal-title').text('Edit Event');
        $('#submit-text').text('Update Event');
        $('#event-id').val(event.id);
        $('#event-title').val(event.title);
        $('#event-description').val(event.description || '');
        $('#event-location').val(event.location);
        $('#event-starts').val(formatDateTimeLocal(event.starts_at));
        $('#event-ends').val(formatDateTimeLocal(event.ends_at));
        
        if (event.metadata?.image_url) {
            $('#preview-img').attr('src', event.metadata.image_url);
            $('#image-preview').removeClass('hidden');
        }
    } else {
        $('#modal-title').text('Create Event');
        $('#submit-text').text('Create Event');
        $('#event-form')[0].reset();
        $('#event-id').val('');
        $('#image-preview').addClass('hidden');
    }
}

function closeModal() {
    $('#event-modal').addClass('hidden');
    $('#event-form')[0].reset();
    $('#image-preview').addClass('hidden');
}

function formatDateTimeLocal(dateString) {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
}

async function handleEventSubmit(e) {
    e.preventDefault();
    
    const id = $('#event-id').val();
    const formData = new FormData();
    
    formData.append('title', $('#event-title').val());
    formData.append('description', $('#event-description').val());
    formData.append('location', $('#event-location').val());
    formData.append('starts_at', new Date($('#event-starts').val()).toISOString());
    formData.append('ends_at', new Date($('#event-ends').val()).toISOString());
    
    const imageFile = $('#event-image')[0].files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }
    
    try {
        let res;
        if (id) {
            res = await API.upload(`/events/${id}`, formData, 'PUT');
        } else {
            res = await API.upload('/events', formData);
        }
        
        if (res.status === 200 || res.status === 201) {
            Utils.showToast(id ? 'Event updated successfully' : 'Event created successfully', 'success');
            closeModal();
            loadEvents();
        } else {
            Utils.showToast(res.message || 'Failed to save event', 'error');
        }
    } catch (err) {
        Utils.showToast('Failed to save event', 'error');
    }
}