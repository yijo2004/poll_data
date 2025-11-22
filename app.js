let pollsData = [];
let statsData = null;
let allUserStats = {};

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'overview' && !statsData) {
        loadOverview();
    } else if (tabName === 'polls' && pollsData.length === 0) {
        loadPolls();
    }
}

async function loadOverview() {
    try {
        const response = await fetch('poll_statistics.txt');
        const text = await response.text();
        parseStatsText(text);
        displayOverview();
    } catch (error) {
        document.getElementById('overview-loading').textContent = 'Error loading statistics';
        console.error(error);
    }
}

function parseStatsText(text) {
    statsData = {
        biggestSheep: [],
        hotTakes: [],
        mostActive: [],
        mostConsistent: [],
        loneWolf: [],
        bandwagoner: [],
        contrarian: []
    };
    
    const lines = text.split('\n');
    let currentCategory = null;
    
    for (let line of lines) {
        if (line.includes('BIGGEST SHEEP')) {
            currentCategory = 'biggestSheep';
        } else if (line.includes('HOT TAKES')) {
            currentCategory = 'hotTakes';
        } else if (line.includes('MOST ACTIVE')) {
            currentCategory = 'mostActive';
        } else if (line.includes('MOST CONSISTENT')) {
            currentCategory = 'mostConsistent';
        } else if (line.includes('LONE WOLF')) {
            currentCategory = 'loneWolf';
        } else if (line.includes('BANDWAGONER')) {
            currentCategory = 'bandwagoner';
        } else if (line.includes('CONTRARIAN')) {
            currentCategory = 'contrarian';
        } else if (currentCategory && line.match(/^\d+\./)) {
            const match = line.match(/^\d+\.\s+(.+?):\s+(.+)$/);
            if (match) {
                statsData[currentCategory].push({
                    name: match[1].trim(),
                    value: match[2].trim()
                });
            }
        }
    }
}

function displayOverview() {
    const grid = document.getElementById('stats-grid');
    grid.innerHTML = '';
    
    const categories = [
        { key: 'biggestSheep', title: 'Biggest Sheep', icon: '🐑' },
        { key: 'hotTakes', title: 'Hot Takes', icon: '🔥' },
        { key: 'mostActive', title: 'Most Active', icon: '📊' },
        { key: 'loneWolf', title: 'Lone Wolf', icon: '🐺' },
        { key: 'bandwagoner', title: 'Bandwagoner', icon: '🚂' },
        { key: 'contrarian', title: 'Contrarian', icon: '⚡' }
    ];
    
    categories.forEach(cat => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `<h3><span class="icon">${cat.icon}</span> ${cat.title}</h3>`;
        
        const items = statsData[cat.key];
        if (items.length === 0) {
            card.innerHTML += '<div class="no-data">No data available</div>';
        } else {
            items.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'stat-item';
                div.innerHTML = `
                    <span class="rank">${index + 1}</span>
                    <span class="name">${item.name}</span>
                    <span class="value">${item.value}</span>
                `;
                card.appendChild(div);
            });
        }
        
        grid.appendChild(card);
    });
    
    document.getElementById('overview-loading').style.display = 'none';
    document.getElementById('overview-content').style.display = 'block';
}

async function loadPolls() {
    try {
        const response = await fetch('all_polls.json');
        pollsData = await response.json();
        displayPolls();
        populateUserSelect();
    } catch (error) {
        document.getElementById('polls-loading').textContent = 'Error loading polls';
        console.error(error);
    }
}

function displayPolls() {
    const container = document.getElementById('polls-content');
    container.innerHTML = '<div class="polls-list" id="polls-list"></div>';
    const list = document.getElementById('polls-list');
    
    pollsData.forEach(poll => {
        const card = document.createElement('div');
        card.className = 'poll-card';
        card.innerHTML = `<h3>${poll.question}</h3>`;
        
        poll.answers.forEach(answer => {
            const answerDiv = document.createElement('div');
            answerDiv.className = 'answer-item';
            const voteCount = answer.voters.length;
            answerDiv.innerHTML = `
                <div class="answer-text">${answer.answer}</div>
                <div class="vote-count">${voteCount} vote${voteCount !== 1 ? 's' : ''}</div>
            `;
            card.appendChild(answerDiv);
        });
        
        list.appendChild(card);
    });
    
    document.getElementById('polls-loading').style.display = 'none';
    document.getElementById('polls-content').style.display = 'block';
}

function filterPolls() {
    const search = document.getElementById('poll-search').value.toLowerCase();
    const cards = document.querySelectorAll('.poll-card');
    
    cards.forEach(card => {
        const question = card.querySelector('h3').textContent.toLowerCase();
        if (question.includes(search)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function populateUserSelect() {
    const select = document.getElementById('user-select');
    const users = new Set();
    
    pollsData.forEach(poll => {
        poll.answers.forEach(answer => {
            answer.voters.forEach(voter => {
                users.add(JSON.stringify({
                    id: voter.id,
                    name: voter.display_name || voter.username
                }));
            });
        });
    });
    
    const userArray = Array.from(users).map(u => JSON.parse(u)).sort((a, b) => 
        a.name.localeCompare(b.name)
    );
    
    userArray.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        select.appendChild(option);
    });
}

async function loadUserStats() {
    const userId = document.getElementById('user-select').value;
    if (!userId) {
        document.getElementById('individual-content').style.display = 'none';
        return;
    }
    
    if (pollsData.length === 0) {
        await loadPolls();
    }
    
    document.getElementById('individual-loading').style.display = 'block';
    document.getElementById('individual-content').style.display = 'none';
    
    try {
        const username = getUsernameFromId(userId);
        const response = await fetch(`user_stats_${username}.txt`);
        if (!response.ok) {
            throw new Error('User stats file not found');
        }
        const text = await response.text();
        displayUserStats(text);
    } catch (error) {
        document.getElementById('individual-loading').innerHTML = 
            '<p>User statistics not available. Please generate them using personal_data.py</p>';
        console.error(error);
    }
}

function getUsernameFromId(userId) {
    for (let poll of pollsData) {
        for (let answer of poll.answers) {
            for (let voter of answer.voters) {
                if (voter.id === userId) {
                    return voter.username;
                }
            }
        }
    }
    return 'unknown';
}

function displayUserStats(text) {
    const container = document.getElementById('individual-content');
    container.innerHTML = '<div class="user-stats"></div>';
    const statsDiv = container.querySelector('.user-stats');
    
    const lines = text.split('\n');
    let currentSection = null;
    let html = '';
    
    for (let line of lines) {
        if (line.startsWith('=')) continue;
        if (line.startsWith('PERSONAL VOTING STATISTICS:')) {
            html += `<h2>${line.replace('PERSONAL VOTING STATISTICS:', '').trim()}</h2>`;
        } else if (line.startsWith('📊') || line.startsWith('📈') || line.startsWith('🐑') || line.startsWith('📝')) {
            if (currentSection) html += '</section>';
            currentSection = line.trim();
            html += `<section><h3>${currentSection}</h3>`;
        } else if (line.trim() && !line.startsWith('-')) {
            html += `<div class="stat-row"><span class="stat-label">${line}</span></div>`;
        }
    }
    if (currentSection) html += '</section>';
    
    statsDiv.innerHTML = html;
    document.getElementById('individual-loading').style.display = 'none';
    document.getElementById('individual-content').style.display = 'block';
}

window.addEventListener('DOMContentLoaded', () => {
    loadOverview();
    loadPolls();
});

