/**
 * TV Guide Application
 * Main JavaScript file for the Electronic Programme Guide
 */

// Application State
const AppState = {
    channels: [],
    programmes: {},
    favourites: new Set(),
    channelOrder: [],
    showFavouritesOnly: false,
    activeDetailsRow: null,
    timelineStart: null,
    timelineEnd: null,
    pixelsPerMinute: 2 // Width scaling for programme blocks
};

// Configuration
const CONFIG = {
    API_URL: '/api/guide',
    TIMELINE_INTERVAL_MINUTES: 30,
    STORAGE_KEYS: {
        FAVOURITES: 'tvguide_favourites',
        CHANNEL_ORDER: 'tvguide_channel_order',
        SHOW_FAVOURITES: 'tvguide_show_favourites'
    }
};

// DOM Elements
const DOM = {
    loadingState: null,
    errorState: null,
    errorMessage: null,
    guideContainer: null,
    timelineHeader: null,
    channelList: null,
    programmeGrid: null,
    programmeWrapper: null,
    goToNowBtn: null,
    toggleFavouritesBtn: null,
    refreshBtn: null,
    currentTimeIndicator: null
};

/**
 * Initialize the application
 */
function init() {
    // Get DOM elements
    DOM.loadingState = document.getElementById('loadingState');
    DOM.errorState = document.getElementById('errorState');
    DOM.errorMessage = document.getElementById('errorMessage');
    DOM.guideContainer = document.getElementById('guideContainer');
    DOM.timelineHeader = document.getElementById('timelineHeader');
    DOM.channelList = document.getElementById('channelList');
    DOM.programmeGrid = document.getElementById('programmeGrid');
    DOM.programmeWrapper = document.querySelector('.programme-wrapper');
    DOM.goToNowBtn = document.getElementById('goToNowBtn');
    DOM.toggleFavouritesBtn = document.getElementById('toggleFavouritesBtn');
    DOM.refreshBtn = document.getElementById('refreshBtn');
    DOM.currentTimeIndicator = document.getElementById('currentTimeIndicator');

    // Load saved preferences
    loadPreferences();

    // Attach event listeners
    attachEventListeners();

    // Load guide data
    loadGuideData();
}

/**
 * Load user preferences from localStorage
 */
function loadPreferences() {
    // Load favourites
    const savedFavourites = localStorage.getItem(CONFIG.STORAGE_KEYS.FAVOURITES);
    if (savedFavourites) {
        AppState.favourites = new Set(JSON.parse(savedFavourites));
    }

    // Load channel order
    const savedOrder = localStorage.getItem(CONFIG.STORAGE_KEYS.CHANNEL_ORDER);
    if (savedOrder) {
        AppState.channelOrder = JSON.parse(savedOrder);
    }

    // Load show favourites preference
    const showFavourites = localStorage.getItem(CONFIG.STORAGE_KEYS.SHOW_FAVOURITES);
    if (showFavourites) {
        AppState.showFavouritesOnly = JSON.parse(showFavourites);
        updateFavouritesButtonState();
    }
}

/**
 * Save preferences to localStorage
 */
function savePreferences() {
    localStorage.setItem(
        CONFIG.STORAGE_KEYS.FAVOURITES,
        JSON.stringify([...AppState.favourites])
    );
    localStorage.setItem(
        CONFIG.STORAGE_KEYS.CHANNEL_ORDER,
        JSON.stringify(AppState.channelOrder)
    );
    localStorage.setItem(
        CONFIG.STORAGE_KEYS.SHOW_FAVOURITES,
        JSON.stringify(AppState.showFavouritesOnly)
    );
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
    DOM.goToNowBtn.addEventListener('click', scrollToNow);
    DOM.toggleFavouritesBtn.addEventListener('click', toggleFavouritesFilter);
    DOM.refreshBtn.addEventListener('click', () => loadGuideData());
    document.getElementById('retryBtn').addEventListener('click', () => loadGuideData());

    // Sync timeline scroll with programme grid scroll
    DOM.programmeWrapper.addEventListener('scroll', syncTimelineScroll);
}

/**
 * Sync timeline header scroll with programme grid scroll
 */
function syncTimelineScroll() {
    DOM.timelineHeader.scrollLeft = DOM.programmeWrapper.scrollLeft;
    updateCurrentTimeIndicator();
}

/**
 * Load guide data from API
 */
async function loadGuideData() {
    showLoadingState();

    try {
        const response = await fetch(CONFIG.API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            throw new Error(data.message || 'Failed to load guide data');
        }

        // Store data in app state
        AppState.channels = data.channels;
        AppState.programmes = data.programmes;

        // Initialize channel order if not set
        if (AppState.channelOrder.length === 0) {
            AppState.channelOrder = data.channels.map(ch => ch.id);
        } else {
            // Merge new channels with existing order
            const existingIds = new Set(AppState.channelOrder);
            const newChannels = data.channels
                .filter(ch => !existingIds.has(ch.id))
                .map(ch => ch.id);
            AppState.channelOrder = [...AppState.channelOrder, ...newChannels];
        }

        // Calculate timeline bounds
        calculateTimelineBounds();

        // Render the guide
        renderGuide();

        // Show guide, hide loading
        showGuideState();

        // Scroll to current time
        setTimeout(scrollToNow, 100);

    } catch (error) {
        console.error('Error loading guide data:', error);
        showErrorState(error.message);
    }
}

/**
 * Calculate timeline start and end times
 */
function calculateTimelineBounds() {
    let earliestTime = null;
    let latestTime = null;

    // Find earliest and latest times across all programmes
    for (const channelId in AppState.programmes) {
        const programmes = AppState.programmes[channelId];
        programmes.forEach(prog => {
            const start = new Date(prog.start);
            const end = new Date(prog.end);

            if (!earliestTime || start < earliestTime) {
                earliestTime = start;
            }
            if (!latestTime || end > latestTime) {
                latestTime = end;
            }
        });
    }

    // Default to 24 hours from now if no data
    if (!earliestTime) {
        earliestTime = new Date();
        earliestTime.setHours(0, 0, 0, 0);
    }
    if (!latestTime) {
        latestTime = new Date(earliestTime);
        latestTime.setHours(23, 59, 59, 999);
    }

    // Round to nearest hour
    earliestTime.setMinutes(0, 0, 0);
    latestTime.setMinutes(0, 0, 0);
    latestTime.setHours(latestTime.getHours() + 1);

    AppState.timelineStart = earliestTime;
    AppState.timelineEnd = latestTime;
}

/**
 * Render the complete guide
 */
function renderGuide() {
    renderTimeline();
    renderChannelsAndProgrammes();
    updateCurrentTimeIndicator();
    startCurrentTimeUpdater();
}

/**
 * Render timeline header
 */
function renderTimeline() {
    DOM.timelineHeader.innerHTML = '';

    const totalMinutes = (AppState.timelineEnd - AppState.timelineStart) / (1000 * 60);
    const slots = Math.ceil(totalMinutes / CONFIG.TIMELINE_INTERVAL_MINUTES);

    for (let i = 0; i < slots; i++) {
        const slotTime = new Date(AppState.timelineStart);
        slotTime.setMinutes(slotTime.getMinutes() + i * CONFIG.TIMELINE_INTERVAL_MINUTES);

        const slotDiv = document.createElement('div');
        slotDiv.className = 'timeline-slot';
        slotDiv.style.minWidth = `${CONFIG.TIMELINE_INTERVAL_MINUTES * AppState.pixelsPerMinute}px`;
        slotDiv.textContent = formatTime(slotTime);

        DOM.timelineHeader.appendChild(slotDiv);
    }
}

/**
 * Render channels and programmes
 */
function renderChannelsAndProgrammes() {
    DOM.channelList.innerHTML = '';
    DOM.programmeGrid.innerHTML = '';

    // Get ordered channels
    const orderedChannels = getOrderedChannels();

    orderedChannels.forEach((channel, index) => {
        renderChannelRow(channel, index);
    });
}

/**
 * Get ordered and filtered channels
 */
function getOrderedChannels() {
    // Create a map for quick channel lookup
    const channelMap = new Map(AppState.channels.map(ch => [ch.id, ch]));

    // Get ordered channels
    let orderedChannels = AppState.channelOrder
        .map(id => channelMap.get(id))
        .filter(ch => ch !== undefined);

    // Filter by favourites if enabled
    if (AppState.showFavouritesOnly) {
        orderedChannels = orderedChannels.filter(ch => AppState.favourites.has(ch.id));
    }

    return orderedChannels;
}

/**
 * Render a single channel row
 */
function renderChannelRow(channel, index) {
    // Create channel list item
    const channelItem = createChannelItem(channel, index);
    DOM.channelList.appendChild(channelItem);

    // Create programme row
    const programmeRow = createProgrammeRow(channel);
    DOM.programmeGrid.appendChild(programmeRow);
}

/**
 * Create channel list item
 */
function createChannelItem(channel, index) {
    const div = document.createElement('div');
    div.className = 'channel-item';
    div.dataset.channelId = channel.id;
    div.dataset.index = index;
    div.draggable = true;

    // Favourite star
    const star = document.createElement('span');
    star.className = 'channel-favourite';
    star.textContent = AppState.favourites.has(channel.id) ? '★' : '☆';
    if (AppState.favourites.has(channel.id)) {
        star.classList.add('active');
    }
    star.addEventListener('click', () => toggleFavourite(channel.id));

    // Channel name
    const name = document.createElement('span');
    name.className = 'channel-name';
    name.textContent = channel.name;

    div.appendChild(star);
    div.appendChild(name);

    // Drag and drop events
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', handleDrop);
    div.addEventListener('dragend', handleDragEnd);

    return div;
}

/**
 * Create programme row
 */
function createProgrammeRow(channel) {
    const row = document.createElement('div');
    row.className = 'programme-row';
    row.dataset.channelId = channel.id;

    const programmes = AppState.programmes[channel.id] || [];

    programmes.forEach(programme => {
        const block = createProgrammeBlock(programme, channel);
        row.appendChild(block);
    });

    return row;
}

/**
 * Create programme block
 */
function createProgrammeBlock(programme, channel) {
    const div = document.createElement('div');
    div.className = 'programme-block';

    const start = new Date(programme.start);
    const end = new Date(programme.end);
    const duration = (end - start) / (1000 * 60); // Duration in minutes
    const offsetFromStart = (start - AppState.timelineStart) / (1000 * 60); // Offset in minutes

    // DIAGNOSTIC LOGGING
    if (channel.id === '4seven.uk' && programme.title.includes('24 Hours')) {
        console.log('=== DIAGNOSTIC: Time Alignment ===');
        console.log('Programme:', programme.title);
        console.log('Raw start string:', programme.start);
        console.log('Parsed start Date:', start);
        console.log('Start ISO:', start.toISOString());
        console.log('Start local time:', start.toLocaleTimeString());
        console.log('Timeline start:', AppState.timelineStart);
        console.log('Timeline start ISO:', AppState.timelineStart.toISOString());
        console.log('Offset from timeline start (minutes):', offsetFromStart);
        console.log('Duration (minutes):', duration);
        console.log('===================================');
    }

    // Calculate position and width
    const left = Math.max(0, offsetFromStart * AppState.pixelsPerMinute); // Don't allow negative positions
    const width = duration * AppState.pixelsPerMinute;

    // If programme starts before timeline, adjust width to show only visible portion
    if (offsetFromStart < 0) {
        const visibleDuration = duration + offsetFromStart; // offsetFromStart is negative
        div.style.width = `${visibleDuration * AppState.pixelsPerMinute}px`;
        div.style.marginLeft = '0px';
    } else {
        div.style.marginLeft = `${left}px`;
        div.style.width = `${width}px`;
    }

    // Title
    const title = document.createElement('div');
    title.className = 'programme-title';
    title.textContent = programme.title;

    // Time
    const time = document.createElement('div');
    time.className = 'programme-time';
    time.textContent = `${formatTime(start)} - ${formatTime(end)}`;

    div.appendChild(title);
    div.appendChild(time);

    // Click to expand details
    div.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('Programme clicked:', programme.title);
        console.log('Description:', programme.description);
        toggleProgrammeDetails(programme, channel, div);
    });

    return div;
}

/**
 * Toggle programme details (accordion)
 */
function toggleProgrammeDetails(programme, channel, blockElement) {
    // If clicking the same programme, close it
    if (AppState.activeDetailsRow && AppState.activeDetailsRow.dataset.programmeTitle === programme.title) {
        closeDetailsRow();
        blockElement.classList.remove('active');
        return;
    }

    // Close existing details row
    closeDetailsRow();

    // Mark this block as active
    document.querySelectorAll('.programme-block.active').forEach(el => el.classList.remove('active'));
    blockElement.classList.add('active');

    // Create details row
    const detailsRow = document.createElement('div');
    detailsRow.className = 'details-row';
    detailsRow.dataset.programmeTitle = programme.title;

    const detailsContent = document.createElement('div');
    detailsContent.className = 'details-content';

    // Header with title and close button
    const header = document.createElement('div');
    header.className = 'details-header';

    const title = document.createElement('h3');
    title.className = 'details-title';
    title.textContent = programme.title;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'details-close';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => {
        closeDetailsRow();
        blockElement.classList.remove('active');
    });

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Time
    const timeDiv = document.createElement('div');
    timeDiv.className = 'details-time';
    const start = new Date(programme.start);
    const end = new Date(programme.end);
    timeDiv.textContent = `${channel.name} • ${formatTime(start)} - ${formatTime(end)}`;

    // Description
    const descDiv = document.createElement('div');
    descDiv.className = 'details-description';
    const description = programme.description || 'No description available.';

    // Try setting text in multiple ways for debugging
    descDiv.textContent = description;
    descDiv.setAttribute('data-desc-length', description.length);

    // Add a test element to verify rendering
    const testSpan = document.createElement('span');
    testSpan.textContent = 'TEST TEXT - If you see this, rendering works!';
    testSpan.style.color = 'red';
    testSpan.style.fontWeight = 'bold';

    console.log('=== DESCRIPTION DIAGNOSTIC ===');
    console.log('Creating details row for:', programme.title);
    console.log('Description:', description);
    console.log('Description length:', description.length);
    console.log('Description first 100 chars:', description.substring(0, 100));
    console.log('descDiv element:', descDiv);
    console.log('descDiv.textContent:', descDiv.textContent);
    console.log('descDiv.innerHTML:', descDiv.innerHTML);

    detailsContent.appendChild(header);
    detailsContent.appendChild(timeDiv);
    detailsContent.appendChild(testSpan); // Add test element
    detailsContent.appendChild(descDiv);
    detailsRow.appendChild(detailsContent);

    // Log after appending
    console.log('After append - descDiv in DOM:', document.contains(descDiv));
    console.log('After append - descDiv.textContent:', descDiv.textContent);
    console.log('============================');

    // Find the corresponding channel row and insert after it
    const channelRows = DOM.programmeGrid.querySelectorAll('.programme-row');
    const channelListItems = DOM.channelList.querySelectorAll('.channel-item');

    let targetIndex = -1;
    channelRows.forEach((row, index) => {
        if (row.dataset.channelId === channel.id) {
            targetIndex = index;
        }
    });

    if (targetIndex >= 0 && targetIndex < channelRows.length - 1) {
        // Insert after the channel row in the grid
        channelRows[targetIndex].after(detailsRow);

        // Also insert a spacer in the channel list to maintain alignment
        const spacer = document.createElement('div');
        spacer.className = 'details-row';
        spacer.style.minHeight = detailsRow.offsetHeight + 'px';
        channelListItems[targetIndex].after(spacer);

        AppState.activeDetailsRow = detailsRow;
    } else {
        // If last row, append at the end
        DOM.programmeGrid.appendChild(detailsRow);

        const spacer = document.createElement('div');
        spacer.className = 'details-row';
        spacer.style.minHeight = detailsRow.offsetHeight + 'px';
        DOM.channelList.appendChild(spacer);

        AppState.activeDetailsRow = detailsRow;
    }
}

/**
 * Close active details row
 */
function closeDetailsRow() {
    if (AppState.activeDetailsRow) {
        AppState.activeDetailsRow.remove();
        AppState.activeDetailsRow = null;

        // Remove spacer from channel list
        const spacers = DOM.channelList.querySelectorAll('.details-row');
        spacers.forEach(spacer => spacer.remove());

        // Remove active state from blocks
        document.querySelectorAll('.programme-block.active').forEach(el => el.classList.remove('active'));
    }
}

/**
 * Toggle favourite status for a channel
 */
function toggleFavourite(channelId) {
    if (AppState.favourites.has(channelId)) {
        AppState.favourites.delete(channelId);
    } else {
        AppState.favourites.add(channelId);
    }

    savePreferences();
    renderChannelsAndProgrammes();
}

/**
 * Toggle favourites filter
 */
function toggleFavouritesFilter() {
    AppState.showFavouritesOnly = !AppState.showFavouritesOnly;
    savePreferences();
    updateFavouritesButtonState();
    renderChannelsAndProgrammes();
}

/**
 * Update favourites button state
 */
function updateFavouritesButtonState() {
    const text = document.getElementById('favouritesToggleText');
    if (AppState.showFavouritesOnly) {
        text.textContent = 'Show All Channels';
        DOM.toggleFavouritesBtn.classList.add('active');
    } else {
        text.textContent = 'Show Favourites Only';
        DOM.toggleFavouritesBtn.classList.remove('active');
    }
}

/**
 * Scroll to current time
 */
function scrollToNow() {
    const now = new Date();

    // Check if now is within timeline bounds
    if (now < AppState.timelineStart || now > AppState.timelineEnd) {
        alert('Current time is outside the guide time range.');
        return;
    }

    const minutesFromStart = (now - AppState.timelineStart) / (1000 * 60);
    const scrollPosition = minutesFromStart * AppState.pixelsPerMinute;

    // Scroll to position (centered)
    const containerWidth = DOM.programmeWrapper.offsetWidth;
    DOM.programmeWrapper.scrollLeft = scrollPosition - containerWidth / 2;
}

/**
 * Update current time indicator position
 */
function updateCurrentTimeIndicator() {
    const now = new Date();

    // Check if now is within timeline bounds
    if (now < AppState.timelineStart || now > AppState.timelineEnd) {
        DOM.currentTimeIndicator.style.display = 'none';
        return;
    }

    const minutesFromStart = (now - AppState.timelineStart) / (1000 * 60);
    const position = minutesFromStart * AppState.pixelsPerMinute;

    DOM.currentTimeIndicator.style.display = 'block';
    DOM.currentTimeIndicator.style.left = `${position}px`;
}

/**
 * Start current time updater
 */
function startCurrentTimeUpdater() {
    // Update every minute
    setInterval(updateCurrentTimeIndicator, 60000);
}

/**
 * Drag and drop handlers for channel reordering
 */
let draggedElement = null;

function handleDragStart(e) {
    draggedElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }

    e.dataTransfer.dropEffect = 'move';

    const target = e.target.closest('.channel-item');
    if (target && target !== draggedElement) {
        target.classList.add('drag-over');
    }

    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    const target = e.target.closest('.channel-item');
    if (target && draggedElement && target !== draggedElement) {
        const draggedId = draggedElement.dataset.channelId;
        const targetId = target.dataset.channelId;

        // Reorder in app state
        const draggedIndex = AppState.channelOrder.indexOf(draggedId);
        const targetIndex = AppState.channelOrder.indexOf(targetId);

        AppState.channelOrder.splice(draggedIndex, 1);
        AppState.channelOrder.splice(targetIndex, 0, draggedId);

        savePreferences();
        renderChannelsAndProgrammes();
    }

    return false;
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');

    // Remove drag-over class from all items
    document.querySelectorAll('.channel-item').forEach(item => {
        item.classList.remove('drag-over');
    });

    draggedElement = null;
}

/**
 * Format time for display
 */
function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Show loading state
 */
function showLoadingState() {
    DOM.loadingState.style.display = 'flex';
    DOM.errorState.style.display = 'none';
    DOM.guideContainer.style.display = 'none';
}

/**
 * Show error state
 */
function showErrorState(message) {
    DOM.loadingState.style.display = 'none';
    DOM.errorState.style.display = 'flex';
    DOM.guideContainer.style.display = 'none';
    DOM.errorMessage.textContent = message;
}

/**
 * Show guide state
 */
function showGuideState() {
    DOM.loadingState.style.display = 'none';
    DOM.errorState.style.display = 'none';
    DOM.guideContainer.style.display = 'flex';
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
