// Home page functionality
$(document).ready(function() {
    loadFeaturedEvents();
    loadStats();
});

async function loadFeaturedEvents() {
    try {
        // Only load if user is logged in, otherwise show placeholder
        if (!Auth.isLoggedIn()) {
            $('#featured-events').html(`
                <div class="col-span-full text-center py-12">
                    <p class="text-white/50 mb-4">Login to explore upcoming events</p>
                    <a href="login.html" class="inline-block px-6 py-3 bg-primary rounded-xl hover:bg-primary/80 transition">Login Now</a>
                </div>
            `);
            return;
        }
        
        const res = await API.get('/events');
        if (res.status === 200 && res.data) {
            const events = res.data.slice(0, 6); // Show first 6
            renderFeaturedEvents(events);
        }
    } catch (err) {
        console.error('Failed to load events:', err);
        $('#featured-events').html('<p class="col-span-full text-center text-white/50">Failed to load events</p>');
    }
}

function renderFeaturedEvents(events) {
    if (events.length === 0) {
        $('#featured-events').html('<p class="col-span-full text-center text-white/50 py-12">No upcoming events</p>');
        return;
    }
    
    const html = events.map(event => {
        const imageUrl = event.metadata?.image_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';
        const startDate = new Date(event.starts_at);
        
        return `
            <a href="event-detail.html?id=${event.id}" class="group relative overflow-hidden rounded-2xl card-hover">
                <div class="aspect-[4/5] relative">
                    <img src="${imageUrl}" alt="${event.title}" class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div class="absolute top-4 left-4 px-3 py-1 glass rounded-full text-sm">
                        <span class="text-accent font-medium">${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div class="absolute bottom-0 left-0 right-0 p-6">
                        <h3 class="text-xl font-bold mb-2 line-clamp-2">${event.title}</h3>
                        <div class="flex items-center gap-2 text-white/60 text-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            <span class="truncate">${event.location || 'TBA'}</span>
                        </div>
                    </div>
                </div>
            </a>
        `;
    }).join('');
    
    $('#featured-events').html(html);
}

async function loadStats() {
    // Try to load stats if admin, otherwise show placeholder numbers
    if (Auth.isAdmin()) {
        try {
            const res = await API.get('/dashboard/admin');
            if (res.status === 200 && res.data) {
                animateCounter('#stat-events', res.data.events?.total_events || 0);
                animateCounter('#stat-users', res.data.users?.total_users || 0);
                animateCounter('#stat-announcements', res.data.announcements?.total_announcements || 0);
                animateCounter('#stat-promos', res.data.promos?.total_promos || 0);
                return;
            }
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    }
    
    // Default animation for non-admin or error
    animateCounter('#stat-events', 50);
    animateCounter('#stat-users', 1000);
    animateCounter('#stat-announcements', 25);
    animateCounter('#stat-promos', 15);
}

function animateCounter(selector, target) {
    const element = $(selector);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            element.text(target);
            clearInterval(timer);
        } else {
            element.text(Math.floor(current));
        }
    }, 16);
}