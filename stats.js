// ==========================================
// STATISTICS PAGE - İSTATİSTİKLER
// ==========================================

let stats = {
    photos: [],
    bucketList: [],
    dates: {},
    messages: []
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    calculateStats();
    createCharts();
    generateFunFacts();
    showMilestones();
});

// Load all data
function loadData() {
    stats.photos = JSON.parse(localStorage.getItem('lovesite_photos') || '[]');
    stats.bucketList = JSON.parse(localStorage.getItem('lovesite_bucketlist') || '[]');
    stats.dates = JSON.parse(localStorage.getItem('lovesite_dates') || '{}');
    stats.messages = JSON.parse(localStorage.getItem('lovesite_messages') || '[]');
}

// Calculate and display statistics
function calculateStats() {
    // Time together
    const relationshipDate = stats.dates.relationship?.date || '2024-01-01';
    const startDate = new Date(relationshipDate);
    const now = new Date();
    const diff = now - startDate;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    document.getElementById('totalDays').textContent = days.toLocaleString('tr-TR');
    document.getElementById('totalHours').textContent = hours.toLocaleString('tr-TR');
    document.getElementById('totalMinutes').textContent = minutes.toLocaleString('tr-TR');
    
    // Photos
    document.getElementById('totalPhotos').textContent = stats.photos.length;
    
    // Bucket list
    const completed = stats.bucketList.filter(item => item.completed).length;
    const total = stats.bucketList.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('completedGoals').textContent = completed;
    document.getElementById('pendingGoals').textContent = total - completed;
    document.getElementById('goalsPercentage').textContent = percentage + '%';
    
    // Progress circle animation
    const circumference = 2 * Math.PI * 65;
    const offset = circumference - (percentage / 100) * circumference;
    const progressCircle = document.getElementById('progressCircle');
    if (progressCircle) {
        progressCircle.style.strokeDashoffset = offset;
        
        // Add gradient
        const svg = progressCircle.closest('svg');
        if (!svg.querySelector('defs')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            gradient.setAttribute('id', 'gradient');
            gradient.setAttribute('x1', '0%');
            gradient.setAttribute('y1', '0%');
            gradient.setAttribute('x2', '100%');
            gradient.setAttribute('y2', '100%');
            
            const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop1.setAttribute('offset', '0%');
            stop1.setAttribute('stop-color', getComputedStyle(document.documentElement).getPropertyValue('--primary-gradient-start').trim());
            
            const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop2.setAttribute('offset', '100%');
            stop2.setAttribute('stop-color', getComputedStyle(document.documentElement).getPropertyValue('--primary-gradient-end').trim());
            
            gradient.appendChild(stop1);
            gradient.appendChild(stop2);
            defs.appendChild(gradient);
            svg.appendChild(defs);
        }
    }
}

// Create charts
function createCharts() {
    createPhotosChart();
    createTimelineChart();
    createCategoryChart();
}

// Photos by category chart
function createPhotosChart() {
    const ctx = document.getElementById('photosChart');
    if (!ctx) return;
    
    const categories = {};
    stats.photos.forEach(photo => {
        const cat = photo.category || 'Diğer';
        categories[cat] = (categories[cat] || 0) + 1;
    });
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    'rgba(240, 147, 251, 0.8)',
                    'rgba(245, 87, 108, 0.8)',
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(74, 222, 128, 0.8)',
                    'rgba(251, 146, 60, 0.8)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// Timeline chart
function createTimelineChart() {
    const ctx = document.getElementById('timelineChart');
    if (!ctx) return;
    
    // Group photos by month
    const monthlyData = {};
    stats.photos.forEach(photo => {
        const date = new Date(photo.uploadedAt || Date.now());
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });
    
    // Sort by date
    const sortedMonths = Object.keys(monthlyData).sort();
    const labels = sortedMonths.map(m => {
        const [year, month] = m.split('-');
        const date = new Date(year, month - 1);
        return date.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' });
    });
    const data = sortedMonths.map(m => monthlyData[m]);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Fotoğraflar',
                data: data,
                borderColor: 'rgba(240, 147, 251, 1)',
                backgroundColor: 'rgba(240, 147, 251, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: {
                            size: 13
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

// Category distribution
function createCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    const categories = {};
    stats.photos.forEach(photo => {
        const cat = photo.category || 'Diğer';
        categories[cat] = (categories[cat] || 0) + 1;
    });
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                label: 'Fotoğraf Sayısı',
                data: Object.values(categories),
                backgroundColor: 'rgba(240, 147, 251, 0.8)',
                borderRadius: 10,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: {
                            size: 13
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Generate fun facts
function generateFunFacts() {
    const container = document.getElementById('funFacts');
    if (!container) return;
    
    const facts = [];
    
    // Calculate facts
    const relationshipDate = stats.dates.relationship?.date || '2024-01-01';
    const daysTogether = Math.floor((new Date() - new Date(relationshipDate)) / (1000 * 60 * 60 * 24));
    const weeksTogether = Math.floor(daysTogether / 7);
    const monthsTogether = Math.floor(daysTogether / 30);
    
    facts.push({
        icon: '💕',
        text: `${daysTogether} gündür birliktesiniz, bu yaklaşık ${weeksTogether} hafta!`
    });
    
    facts.push({
        icon: '📸',
        text: `${stats.photos.length} fotoğrafla ${stats.photos.length} anı biriktirdiniz!`
    });
    
    const completedGoals = stats.bucketList.filter(item => item.completed).length;
    if (completedGoals > 0) {
        facts.push({
            icon: '🎯',
            text: `${completedGoals} hedef tamamladınız, harika gidiyorsunuz!`
        });
    }
    
    if (daysTogether >= 365) {
        const years = Math.floor(daysTogether / 365);
        facts.push({
            icon: '🎉',
            text: `${years} yıldır birliktesiniz! Her yıl daha güzel!`
        });
    }
    
    if (stats.photos.length > 0) {
        const avgPerMonth = Math.round(stats.photos.length / (monthsTogether || 1));
        facts.push({
            icon: '📊',
            text: `Ayda ortalama ${avgPerMonth} fotoğraf yüklüyorsunuz.`
        });
    }
    
    facts.push({
        icon: '⏰',
        text: `${(daysTogether * 24).toLocaleString('tr-TR')} saat, ${(daysTogether * 24 * 60).toLocaleString('tr-TR')} dakika birliktesiniz!`
    });
    
    // Display facts
    container.innerHTML = facts.map(fact => `
        <div class="fun-fact">
            <span class="fact-icon">${fact.icon}</span>
            <span class="fact-text">${fact.text}</span>
        </div>
    `).join('');
}

// Show milestones
function showMilestones() {
    const container = document.getElementById('milestones');
    if (!container) return;
    
    const milestones = [];
    
    // Get all dates
    const allDates = [];
    
    if (stats.dates.firstMeet?.date) {
        allDates.push({
            icon: '👋',
            title: stats.dates.firstMeet.title || 'İlk Tanışma',
            date: new Date(stats.dates.firstMeet.date)
        });
    }
    
    if (stats.dates.relationship?.date) {
        allDates.push({
            icon: '💕',
            title: stats.dates.relationship.title || 'İlişki Başlangıcı',
            date: new Date(stats.dates.relationship.date)
        });
    }
    
    if (stats.dates.firstKiss?.date) {
        allDates.push({
            icon: '💋',
            title: stats.dates.firstKiss.title || 'İlk Öpücük',
            date: new Date(stats.dates.firstKiss.date)
        });
    }
    
    if (stats.dates.specialDay?.date) {
        allDates.push({
            icon: '✨',
            title: stats.dates.specialDay.title || 'Özel Günümüz',
            date: new Date(stats.dates.specialDay.date)
        });
    }
    
    // Sort by date
    allDates.sort((a, b) => a.date - b.date);
    
    // Display milestones
    container.innerHTML = allDates.map(milestone => {
        const daysAgo = Math.floor((new Date() - milestone.date) / (1000 * 60 * 60 * 24));
        return `
            <div class="milestone">
                <div class="milestone-icon">${milestone.icon}</div>
                <div class="milestone-content">
                    <div class="milestone-title">${milestone.title}</div>
                    <div class="milestone-date">${milestone.date.toLocaleDateString('tr-TR', { 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                    })}</div>
                    <div class="milestone-days">${daysAgo} gün önce</div>
                </div>
            </div>
        `;
    }).join('');
    
    if (allDates.length === 0) {
        container.innerHTML = '<p style="text-align: center; opacity: 0.7;">Henüz özel gün eklenmemiş. Ayarlar sayfasından ekleyebilirsiniz.</p>';
    }
}

// Auto refresh
window.addEventListener('focus', function() {
    loadData();
    calculateStats();
});
