document.addEventListener('DOMContentLoaded', () => {
    // Get user data from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    // If no user data or token, redirect to login
    if (!user || !token) {
        window.location.href = '/login';
        return;
    }

    // Update user information
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userEmail').textContent = user.email;

    // Handle logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        // Clear local storage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Redirect to login page
        window.location.href = '/login';
    });

    // Fetch user statistics
    fetchUserStats();
    
    // Fetch recent activity
    fetchRecentActivity();

    // Add click handlers for main action buttons
    const createCarpoolBtn = document.querySelector('button:contains("Create a Carpool")');
    if (createCarpoolBtn) {
        createCarpoolBtn.addEventListener('click', showCarpoolCreationForm);
    }

    const registerVehicleBtn = document.querySelector('button:contains("Register a Vehicle")');
    if (registerVehicleBtn) {
        registerVehicleBtn.addEventListener('click', showVehicleRegistrationForm);
    }

    // Add click handlers for track buttons
    document.querySelectorAll('.action-button:contains("Track")').forEach(button => {
        button.addEventListener('click', (e) => {
            const vehicleLicensePlate = e.target.closest('.carpool-item').querySelector('p:contains("Vehicle:")').textContent.split(': ')[1];
            showVehicleTracker(vehicleLicensePlate);
        });
    });
});

async function fetchUserStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user stats');
        }

        const stats = await response.json();
        
        // Update stats display
        document.getElementById('vehicleCount').textContent = stats.vehicles || 0;
        document.getElementById('rideCount').textContent = stats.rides || 0;
        document.getElementById('carpoolCount').textContent = stats.carpools || 0;

    } catch (error) {
        console.error('Error fetching user stats:', error);
        // Set default values if fetch fails
        document.getElementById('vehicleCount').textContent = '0';
        document.getElementById('rideCount').textContent = '0';
        document.getElementById('carpoolCount').textContent = '0';
    }
}

async function fetchRecentActivity() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/user/activity', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch recent activity');
        }

        const activities = await response.json();
        const activityList = document.getElementById('activityList');
        
        if (activities.length === 0) {
            activityList.innerHTML = '<p class="no-activity">No recent activity</p>';
            return;
        }

        // Display activities
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-details">
                    <p class="activity-text">${activity.description}</p>
                    <span class="activity-time">${formatActivityTime(activity.timestamp)}</span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error fetching recent activity:', error);
        document.getElementById('activityList').innerHTML = 
            '<p class="error-message">Failed to load recent activity</p>';
    }
}

function getActivityIcon(type) {
    const icons = {
        'vehicle': 'fa-car',
        'ride': 'fa-route',
        'carpool': 'fa-users',
        'profile': 'fa-user',
        'default': 'fa-circle'
    };
    return icons[type] || icons.default;
}

function formatActivityTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
        if (diffInHours === 0) {
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
        }
        return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Dashboard Functionality

// Initialize map with Mapbox
let map;
let marker;
let vehicleMarkers = new Map();

function initializeMap(vehicleLicensePlate) {
    mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN'; // Replace with your Mapbox token

    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [23.7128, 56.5050], // Liepaja coordinates
        zoom: 12
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl());

    // Add vehicle marker
    marker = new mapboxgl.Marker({
        color: "#7C3AED",
        draggable: false
    });

    // Simulate real-time updates
    startVehicleTracking(vehicleLicensePlate);
}

function startVehicleTracking(vehicleLicensePlate) {
    // Simulate vehicle movement (in real app, this would be real-time data from server)
    const simulateMovement = () => {
        // Simulate vehicle location updates
        const newLng = 23.7128 + (Math.random() - 0.5) * 0.02;
        const newLat = 56.5050 + (Math.random() - 0.5) * 0.02;
        
        marker.setLngLat([newLng, newLat]).addTo(map);
        
        // Update vehicle info
        document.getElementById('lastUpdated').textContent = new Date().toLocaleTimeString();
        
        // Update vehicle status randomly
        const statuses = ['Active', 'In Transit', 'Parked', 'Arriving'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        document.getElementById('vehicleStatus').textContent = randomStatus;
    };

    // Update every 3 seconds
    simulateMovement();
    return setInterval(simulateMovement, 3000);
}

// Vehicle Registration
function showVehicleRegistrationForm() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Register New Vehicle</h2>
            <form id="vehicleRegistrationForm">
                <div class="form-group">
                    <label for="vehicleType">Vehicle Type</label>
                    <select id="vehicleType" required>
                        <option value="car">Car</option>
                        <option value="scooter">Scooter</option>
                        <option value="bike">Bike</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="licensePlate">License Plate</label>
                    <input type="text" id="licensePlate" required pattern="[A-Z0-9]+" title="License plate should contain only uppercase letters and numbers">
                </div>
                <div class="form-group">
                    <label for="model">Model</label>
                    <input type="text" id="model" required>
                </div>
                <div class="form-group">
                    <label for="year">Year</label>
                    <input type="number" id="year" min="1900" max="2024" required>
                </div>
                <div class="form-group">
                    <label for="color">Color</label>
                    <input type="text" id="color" required>
                </div>
                <div class="form-group">
                    <label>Features</label>
                    <div class="checkbox-group">
                        <label>
                            <input type="checkbox" id="airConditioned"> Air Conditioned
                        </label>
                        <label>
                            <input type="checkbox" id="wheelchair"> Wheelchair Accessible
                        </label>
                        <label>
                            <input type="checkbox" id="luggage"> Luggage Space
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label for="insuranceProvider">Insurance Provider</label>
                    <input type="text" id="insuranceProvider" required>
                </div>
                <div class="form-group">
                    <label for="insuranceNumber">Insurance Number</label>
                    <input type="text" id="insuranceNumber" required>
                </div>
                <div class="form-group">
                    <label for="insuranceExpiry">Insurance Expiry</label>
                    <input type="date" id="insuranceExpiry" required>
                </div>
                <div class="button-group">
                    <button type="submit" class="action-button">Register Vehicle</button>
                    <button type="button" class="action-button cancel" onclick="closeModal()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('vehicleRegistrationForm').addEventListener('submit', handleVehicleRegistration);
}

async function handleVehicleRegistration(e) {
    e.preventDefault();
    const formData = {
        vehicleType: document.getElementById('vehicleType').value,
        licensePlate: document.getElementById('licensePlate').value,
        model: document.getElementById('model').value,
        year: document.getElementById('year').value,
        color: document.getElementById('color').value,
        features: {
            airConditioned: document.getElementById('airConditioned').checked,
            wheelchair: document.getElementById('wheelchair').checked,
            luggage: document.getElementById('luggage').checked
        },
        insurance: {
            provider: document.getElementById('insuranceProvider').value,
            number: document.getElementById('insuranceNumber').value,
            expiry: document.getElementById('insuranceExpiry').value
        }
    };

    try {
        // Here we would normally send this to the server
        console.log('Registering vehicle:', formData);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addVehicleToList(formData);
        closeModal();
        showNotification('Vehicle registered successfully!');
        
        // Update stats
        const vehicleCount = document.querySelector('.summary-item p').textContent;
        document.querySelector('.summary-item p').textContent = parseInt(vehicleCount) + 1;
    } catch (error) {
        showNotification('Failed to register vehicle. Please try again.', 'error');
    }
}

// Carpool Creation
function showCarpoolCreationForm() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Create New Carpool</h2>
            <form id="carpoolCreationForm">
                <div class="form-group">
                    <label for="fromLocation">From</label>
                    <input type="text" id="fromLocation" required>
                </div>
                <div class="form-group">
                    <label for="toLocation">To</label>
                    <input type="text" id="toLocation" required>
                </div>
                <div class="form-group">
                    <label for="date">Date</label>
                    <input type="date" id="date" required min="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label for="time">Time</label>
                    <input type="time" id="time" required>
                </div>
                <div class="form-group">
                    <label for="seats">Available Seats</label>
                    <input type="number" id="seats" min="1" max="8" required>
                </div>
                <div class="form-group">
                    <label for="farePerSeat">Fare per Seat (€)</label>
                    <input type="number" id="farePerSeat" min="0" step="0.5" required>
                </div>
                <div class="form-group">
                    <label for="vehicle">Vehicle</label>
                    <select id="vehicle" required>
                        <!-- Will be populated dynamically -->
                    </select>
                </div>
                <div class="form-group">
                    <label>Preferences</label>
                    <div class="checkbox-group">
                        <label>
                            <input type="checkbox" id="smoking"> Smoking Allowed
                        </label>
                        <label>
                            <input type="checkbox" id="music"> Music
                        </label>
                        <label>
                            <input type="checkbox" id="pets"> Pets Allowed
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label for="notes">Additional Notes</label>
                    <textarea id="notes" rows="3"></textarea>
                </div>
                <div class="button-group">
                    <button type="submit" class="action-button">Create Carpool</button>
                    <button type="button" class="action-button cancel" onclick="closeModal()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    // Populate vehicle dropdown
    const vehicleSelect = document.getElementById('vehicle');
    const vehicles = getRegisteredVehicles();
    vehicles.forEach(vehicle => {
        const option = document.createElement('option');
        option.value = vehicle.licensePlate;
        option.textContent = `${vehicle.model} (${vehicle.licensePlate})`;
        vehicleSelect.appendChild(option);
    });

    document.getElementById('carpoolCreationForm').addEventListener('submit', handleCarpoolCreation);
}

async function handleCarpoolCreation(e) {
    e.preventDefault();
    const formData = {
        from: document.getElementById('fromLocation').value,
        to: document.getElementById('toLocation').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        seats: document.getElementById('seats').value,
        vehicle: document.getElementById('vehicle').value,
        preferences: {
            smoking: document.getElementById('smoking').checked,
            music: document.getElementById('music').checked,
            pets: document.getElementById('pets').checked
        },
        farePerSeat: document.getElementById('farePerSeat').value,
        notes: document.getElementById('notes').value
    };

    try {
        // Here we would normally send this to the server
        console.log('Creating carpool:', formData);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        addCarpoolToList(formData);
        closeModal();
        showNotification('Carpool created successfully!');
        
        // Update stats
        const carpoolCount = document.querySelectorAll('.summary-item p')[1].textContent;
        document.querySelectorAll('.summary-item p')[1].textContent = parseInt(carpoolCount) + 1;
    } catch (error) {
        showNotification('Failed to create carpool. Please try again.', 'error');
    }
}

// Vehicle Tracking
function showVehicleTracker(vehicleLicensePlate) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content tracker">
            <h2>Vehicle Tracker</h2>
            <div id="map" style="height: 400px; width: 100%; margin-bottom: 1rem;"></div>
            <div class="vehicle-info">
                <p><strong>License Plate:</strong> ${vehicleLicensePlate}</p>
                <p><strong>Last Updated:</strong> <span id="lastUpdated">Just now</span></p>
                <p><strong>Status:</strong> <span id="vehicleStatus">Active</span></p>
            </div>
            <div class="button-group">
                <button class="action-button" onclick="closeModal()">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Initialize map
    initializeMap(vehicleLicensePlate);
}

// Utility Functions
function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function getRegisteredVehicles() {
    // Mock function - would normally fetch from server
    return [
        { licensePlate: 'XYZ1234', model: 'Toyota Camry' },
        { licensePlate: 'ABC5678', model: 'Honda Scooter' }
    ];
}

function addVehicleToList(vehicle) {
    const vehiclesList = document.querySelector('.vehicle-list');
    const vehicleItem = document.createElement('div');
    vehicleItem.className = 'vehicle-item';
    vehicleItem.innerHTML = `
        <h3><i class="fas fa-${vehicle.vehicleType}"></i> ${vehicle.model} - License Plate: ${vehicle.licensePlate}</h3>
        <p><i class="fas fa-check-circle"></i> Status: Active</p>
    `;
    vehiclesList.appendChild(vehicleItem);
}

function addCarpoolToList(carpool) {
    const carpoolsList = document.querySelector('.carpool-list');
    const carpoolItem = document.createElement('div');
    carpoolItem.className = 'carpool-item';
    carpoolItem.innerHTML = `
        <h3><i class="fas fa-map-marker-alt"></i> ${carpool.from} to ${carpool.to}</h3>
        <p><i class="far fa-clock"></i> ${carpool.date} at ${carpool.time} (Seats: ${carpool.seats})</p>
        <p><i class="fas fa-car"></i> Vehicle: ${carpool.vehicle}</p>
        <div class="action-buttons">
            <button class="action-button" onclick="showVehicleTracker('${carpool.vehicle}')">
                <i class="fas fa-location-arrow"></i>
                Track
            </button>
        </div>
    `;
    carpoolsList.appendChild(carpoolItem);
}

// Dashboard Navigation and Data Management

// Check authentication
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) {
        window.location.href = '/login.html';
    }
    return user;
}

// Load user data
function loadUserData() {
    const user = checkAuth();
    if (user) {
        document.getElementById('userName').textContent = `${user.firstName} ${user.lastName}`;
        document.getElementById('userAvatar').textContent = `${user.firstName[0]}${user.lastName[0]}`;
        document.getElementById('userRole').textContent = user.userRole || 'User';
    }
}

// Navigation handler
function handleNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const route = e.currentTarget.getAttribute('data-route');
            if (route) {
                window.location.href = `${route}.html`;
            }
        });
    });
}

// Load dashboard statistics
async function loadDashboardStats() {
    try {
        const user = checkAuth();
        const response = await fetch('/api/dashboard/stats', {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });
        const stats = await response.json();
        
        // Update statistics
        if (stats.vehicles) {
            document.querySelector('[data-stat="vehicles"]').textContent = stats.vehicles.count;
            document.querySelector('[data-stat="vehicles-trend"]').textContent = 
                `${stats.vehicles.trend}% from last month`;
        }
        
        if (stats.carpools) {
            document.querySelector('[data-stat="carpools"]').textContent = stats.carpools.count;
            document.querySelector('[data-stat="carpools-trend"]').textContent = 
                `${stats.carpools.trend}% from last week`;
        }
        
        if (stats.approvals) {
            document.querySelector('[data-stat="approvals"]').textContent = stats.approvals.count;
            document.querySelector('[data-stat="approvals-trend"]').textContent = 
                `${stats.approvals.trend}% from yesterday`;
        }
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const user = checkAuth();
        const response = await fetch('/api/dashboard/activity', {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });
        const activities = await response.json();
        
        const activityList = document.querySelector('.activity-list');
        activityList.innerHTML = activities.map(activity => `
            <li class="activity-item">
                <div class="activity-icon ${activity.type}">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${activity.time}</div>
                </div>
            </li>
        `).join('');
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    handleNavigation();
    loadDashboardStats();
    loadRecentActivity();
}); 