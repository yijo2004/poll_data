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
                const name = item.name.length > 30 ? item.name.substring(0, 27) + '...' : item.name;
                const value = item.value.length > 20 ? item.value.substring(0, 17) + '...' : item.value;
                div.innerHTML = `
                    <span class="rank">${index + 1}</span>
                    <span class="name" title="${item.name}">${name}</span>
                    <span class="value" title="${item.value}">${value}</span>
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
    
    pollsData.forEach((poll, pollIndex) => {
        const card = document.createElement('div');
        card.className = 'poll-card';
        card.innerHTML = `<h3>${poll.question}</h3>`;
        
        poll.answers.forEach((answer, answerIndex) => {
            const answerDiv = document.createElement('div');
            answerDiv.className = 'answer-item';
            answerDiv.style.cursor = 'pointer';
            const voteCount = answer.voters.length;
            answerDiv.innerHTML = `
                <div class="answer-text">${answer.answer}</div>
                <div class="vote-count">${voteCount} vote${voteCount !== 1 ? 's' : ''}</div>
            `;
            
            answerDiv.onclick = () => showVoters(pollIndex, answerIndex, answer);
            card.appendChild(answerDiv);
        });
        
        list.appendChild(card);
    });
    
    document.getElementById('polls-loading').style.display = 'none';
    document.getElementById('polls-content').style.display = 'block';
}

function showVoters(pollIndex, answerIndex, answer) {
    const modal = document.getElementById('voters-modal');
    if (!modal) {
        createVotersModal();
    }
    
    const modalTitle = document.getElementById('voters-modal-title');
    const modalAnswer = document.getElementById('voters-modal-answer');
    const modalVoters = document.getElementById('voters-modal-list');
    
    const poll = pollsData[pollIndex];
    modalTitle.textContent = poll.question;
    modalAnswer.textContent = answer.answer;
    
    modalVoters.innerHTML = '';
    
    if (answer.voters.length === 0) {
        modalVoters.innerHTML = '<div class="no-voters">No voters</div>';
    } else {
        answer.voters.forEach(voter => {
            const voterDiv = document.createElement('div');
            voterDiv.className = 'voter-item';
            voterDiv.textContent = voter.display_name || voter.username || 'Unknown';
            modalVoters.appendChild(voterDiv);
        });
    }
    
    document.getElementById('voters-modal').style.display = 'flex';
}

function createVotersModal() {
    const modal = document.createElement('div');
    modal.id = 'voters-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="voters-modal-title"></h3>
                <button class="modal-close" onclick="closeVotersModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="modal-answer" id="voters-modal-answer"></div>
                <div class="modal-voters-label">Voters:</div>
                <div class="modal-voters-list" id="voters-modal-list"></div>
            </div>
        </div>
    `;
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeVotersModal();
        }
    };
    document.body.appendChild(modal);
}

function closeVotersModal() {
    document.getElementById('voters-modal').style.display = 'none';
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
    
    const userInfo = getUserInfo(userId);
    if (!userInfo) {
        document.getElementById('individual-loading').innerHTML = 
            '<p>User not found</p>';
        return;
    }
    
    const stats = calculateUserStats(userId);
    const allUserStats = calculateAllUserStats();
    displayUserStats(userInfo, stats, allUserStats);
}

function getUserInfo(userId) {
    for (let poll of pollsData) {
        for (let answer of poll.answers) {
            for (let voter of answer.voters) {
                if (voter.id === userId) {
                    return {
                        display_name: voter.display_name || voter.username,
                        username: voter.username
                    };
                }
            }
        }
    }
    return null;
}

function calculateUserStats(userId) {
    const stats = {
        total_votes: 0,
        polls_participated: new Set(),
        unique_answers: new Set(),
        majority_votes: 0,
        minority_votes: 0,
        lone_wolf_votes: 0,
        answers_by_poll: []
    };
    
    for (let poll of pollsData) {
        if (!poll.answers || poll.answers.length === 0) continue;
        
        const answerVoteCounts = {};
        for (let answer of poll.answers) {
            const actualVoteCount = answer.voters ? answer.voters.length : 0;
            answerVoteCounts[answer.answer] = actualVoteCount;
        }
        
        const totalVotes = Object.values(answerVoteCounts).reduce((a, b) => a + b, 0);
        if (totalVotes === 0) continue;
        
        const maxVotes = Math.max(...Object.values(answerVoteCounts));
        const minVotes = Math.min(...Object.values(answerVoteCounts));
        const majorityThreshold = totalVotes / 2;
        
        let userVotedInPoll = false;
        const pollData = {
            question: poll.question,
            user_answer: null,
            answer_vote_count: 0,
            total_votes: totalVotes,
            was_majority: false,
            was_minority: false,
            was_lone_wolf: false
        };
        
        for (let answer of poll.answers) {
            const actualVoteCount = answer.voters ? answer.voters.length : 0;
            const isMajority = actualVoteCount === maxVotes && actualVoteCount > majorityThreshold;
            const isMinority = actualVoteCount === minVotes && actualVoteCount < majorityThreshold;
            const isLoneWolf = actualVoteCount <= 2;
            
            if (answer.voters) {
                for (let voter of answer.voters) {
                    if (voter.id === userId) {
                        stats.total_votes++;
                        stats.polls_participated.add(poll.question);
                        stats.unique_answers.add(answer.answer);
                        
                        if (isMajority) stats.majority_votes++;
                        if (isMinority) stats.minority_votes++;
                        if (isLoneWolf) stats.lone_wolf_votes++;
                        
                        userVotedInPoll = true;
                        pollData.user_answer = answer.answer;
                        pollData.answer_vote_count = actualVoteCount;
                        pollData.was_majority = isMajority;
                        pollData.was_minority = isMinority;
                        pollData.was_lone_wolf = isLoneWolf;
                        break;
                    }
                }
            }
        }
        
        if (userVotedInPoll) {
            stats.answers_by_poll.push(pollData);
        }
    }
    
    stats.polls_participated = stats.polls_participated.size;
    stats.unique_answers = stats.unique_answers.size;
    
    return stats;
}

function calculateAllUserStats() {
    const allStats = {};
    
    for (let poll of pollsData) {
        if (!poll.answers || poll.answers.length === 0) continue;
        
        const answerVoteCounts = {};
        for (let answer of poll.answers) {
            const actualVoteCount = answer.voters ? answer.voters.length : 0;
            answerVoteCounts[answer.answer] = actualVoteCount;
        }
        
        const totalVotes = Object.values(answerVoteCounts).reduce((a, b) => a + b, 0);
        if (totalVotes === 0) continue;
        
        const maxVotes = Math.max(...Object.values(answerVoteCounts));
        const minVotes = Math.min(...Object.values(answerVoteCounts));
        const majorityThreshold = totalVotes / 2;
        
        for (let answer of poll.answers) {
            const actualVoteCount = answer.voters ? answer.voters.length : 0;
            const isMajority = actualVoteCount === maxVotes && actualVoteCount > majorityThreshold;
            const isMinority = actualVoteCount === minVotes && actualVoteCount < majorityThreshold;
            const isLoneWolf = actualVoteCount <= 2;
            
            if (answer.voters) {
                for (let voter of answer.voters) {
                    const userId = voter.id;
                    if (!allStats[userId]) {
                        allStats[userId] = {
                            total_votes: 0,
                            polls_participated: new Set(),
                            majority_votes: 0,
                            minority_votes: 0,
                            lone_wolf_votes: 0
                        };
                    }
                    
                    allStats[userId].total_votes++;
                    allStats[userId].polls_participated.add(poll.question);
                    
                    if (isMajority) allStats[userId].majority_votes++;
                    if (isMinority) allStats[userId].minority_votes++;
                    if (isLoneWolf) allStats[userId].lone_wolf_votes++;
                }
            }
        }
    }
    
    for (let userId in allStats) {
        allStats[userId].polls_participated = allStats[userId].polls_participated.size;
    }
    
    return allStats;
}

function calculatePercentile(value, allValues) {
    if (!allValues || allValues.length === 0) return 50;
    const sorted = [...allValues].sort((a, b) => a - b);
    const below = sorted.filter(v => v < value).length;
    return (below / sorted.length) * 100;
}

function displayUserStats(userInfo, stats, allUserStats) {
    const container = document.getElementById('individual-content');
    container.innerHTML = '<div class="user-stats"></div>';
    const statsDiv = container.querySelector('.user-stats');
    
    let html = `<h2>${userInfo.display_name}</h2>`;
    
    html += '<section><h3>📊 OVERVIEW</h3>';
    html += `<div class="stat-row"><span class="stat-label">Total Votes:</span><span class="stat-value">${stats.total_votes}</span></div>`;
    html += `<div class="stat-row"><span class="stat-label">Polls Participated:</span><span class="stat-value">${stats.polls_participated}</span></div>`;
    html += `<div class="stat-row"><span class="stat-label">Unique Answers Given:</span><span class="stat-value">${stats.unique_answers}</span></div>`;
    if (stats.polls_participated > 0) {
        html += `<div class="stat-row"><span class="stat-label">Average Votes per Poll:</span><span class="stat-value">${(stats.total_votes / stats.polls_participated).toFixed(2)}</span></div>`;
    }
    html += '</section>';
    
    const allTotalVotes = Object.values(allUserStats).map(s => s.total_votes).filter(v => v > 0);
    const allPollsParticipated = Object.values(allUserStats).map(s => s.polls_participated).filter(v => v > 0);
    
    if (allTotalVotes.length > 0) {
        const avgTotalVotes = allTotalVotes.reduce((a, b) => a + b, 0) / allTotalVotes.length;
        const medianTotalVotes = [...allTotalVotes].sort((a, b) => a - b)[Math.floor(allTotalVotes.length / 2)];
        const userPercentileVotes = calculatePercentile(stats.total_votes, allTotalVotes);
        const rank = allTotalVotes.filter(v => v > stats.total_votes).length + 1;
        
        html += '<section><h3>📈 COMPARATIVE STATISTICS</h3>';
        html += `<div class="stat-row"><span class="stat-label">Your Total Votes:</span><span class="stat-value">${stats.total_votes}</span></div>`;
        html += `<div class="stat-row"><span class="stat-label">Average User Votes:</span><span class="stat-value">${avgTotalVotes.toFixed(1)}</span></div>`;
        html += `<div class="stat-row"><span class="stat-label">Median User Votes:</span><span class="stat-value">${medianTotalVotes}</span></div>`;
        html += `<div class="stat-row"><span class="stat-label">Difference from Average:</span><span class="stat-value">${(stats.total_votes - avgTotalVotes).toFixed(1)} votes</span></div>`;
        html += `<div class="stat-row"><span class="stat-label">Percentile Rank:</span><span class="stat-value">Top ${(100 - userPercentileVotes).toFixed(1)}% of voters</span></div>`;
        html += `<div class="stat-row"><span class="stat-label">Ranking:</span><span class="stat-value">#${rank} out of ${allTotalVotes.length} voters</span></div>`;
        html += '</section>';
    }
    
    if (allPollsParticipated.length > 0) {
        const avgPolls = allPollsParticipated.reduce((a, b) => a + b, 0) / allPollsParticipated.length;
        const medianPolls = [...allPollsParticipated].sort((a, b) => a - b)[Math.floor(allPollsParticipated.length / 2)];
        const userPercentilePolls = calculatePercentile(stats.polls_participated, allPollsParticipated);
        
        html += `<div class="stat-row"><span class="stat-label">Your Polls Participated:</span><span class="stat-value">${stats.polls_participated}</span></div>`;
        html += `<div class="stat-row"><span class="stat-label">Average User Polls:</span><span class="stat-value">${avgPolls.toFixed(1)}</span></div>`;
        html += `<div class="stat-row"><span class="stat-label">Median User Polls:</span><span class="stat-value">${medianPolls}</span></div>`;
        html += `<div class="stat-row"><span class="stat-label">Difference from Average:</span><span class="stat-value">${(stats.polls_participated - avgPolls).toFixed(1)} polls</span></div>`;
        html += `<div class="stat-row"><span class="stat-label">Percentile Rank:</span><span class="stat-value">Top ${(100 - userPercentilePolls).toFixed(1)}% of participants</span></div>`;
    }
    
    if (stats.total_votes > 0) {
        const majorityPct = (stats.majority_votes / stats.total_votes) * 100;
        const minorityPct = (stats.minority_votes / stats.total_votes) * 100;
        const loneWolfPct = (stats.lone_wolf_votes / stats.total_votes) * 100;
        
        html += '<section><h3>🐑 VOTING PATTERNS</h3>';
        html += `<div class="stat-row"><span class="stat-label">Majority Votes:</span><span class="stat-value">${stats.majority_votes}/${stats.total_votes} (${majorityPct.toFixed(1)}%)</span></div>`;
        html += `<div class="stat-row"><span class="stat-label">Minority Votes:</span><span class="stat-value">${stats.minority_votes}/${stats.total_votes} (${minorityPct.toFixed(1)}%)</span></div>`;
        html += `<div class="stat-row"><span class="stat-label">Lone Wolf Votes (≤2 votes):</span><span class="stat-value">${stats.lone_wolf_votes}/${stats.total_votes} (${loneWolfPct.toFixed(1)}%)</span></div>`;
        
        const allMajorityPcts = [];
        const allMinorityPcts = [];
        const allLoneWolfPcts = [];
        
        for (let userId in allUserStats) {
            const userStats = allUserStats[userId];
            if (userStats.total_votes > 0) {
                allMajorityPcts.push((userStats.majority_votes / userStats.total_votes) * 100);
                allMinorityPcts.push((userStats.minority_votes / userStats.total_votes) * 100);
                allLoneWolfPcts.push((userStats.lone_wolf_votes / userStats.total_votes) * 100);
            }
        }
        
        if (allMajorityPcts.length > 0) {
            const avgMajority = allMajorityPcts.reduce((a, b) => a + b, 0) / allMajorityPcts.length;
            const userMajorityPercentile = calculatePercentile(majorityPct, allMajorityPcts);
            html += `<div class="stat-row"><span class="stat-label">→ Average user:</span><span class="stat-value">${avgMajority.toFixed(1)}% majority votes</span></div>`;
            html += `<div class="stat-row"><span class="stat-label">→ You rank in top:</span><span class="stat-value">${(100 - userMajorityPercentile).toFixed(1)}% for majority voting</span></div>`;
        }
        
        if (allMinorityPcts.length > 0) {
            const avgMinority = allMinorityPcts.reduce((a, b) => a + b, 0) / allMinorityPcts.length;
            const userMinorityPercentile = calculatePercentile(minorityPct, allMinorityPcts);
            html += `<div class="stat-row"><span class="stat-label">→ Average user:</span><span class="stat-value">${avgMinority.toFixed(1)}% minority votes</span></div>`;
            html += `<div class="stat-row"><span class="stat-label">→ You rank in top:</span><span class="stat-value">${(100 - userMinorityPercentile).toFixed(1)}% for minority voting</span></div>`;
        }
        
        if (allLoneWolfPcts.length > 0) {
            const avgLoneWolf = allLoneWolfPcts.reduce((a, b) => a + b, 0) / allLoneWolfPcts.length;
            const userLoneWolfPercentile = calculatePercentile(loneWolfPct, allLoneWolfPcts);
            html += `<div class="stat-row"><span class="stat-label">→ Average user:</span><span class="stat-value">${avgLoneWolf.toFixed(1)}% lone wolf votes</span></div>`;
            html += `<div class="stat-row"><span class="stat-label">→ You rank in top:</span><span class="stat-value">${(100 - userLoneWolfPercentile).toFixed(1)}% for lone wolf voting</span></div>`;
        }
        
        html += '<div class="stat-row" style="margin-top: 8px;">';
        if (majorityPct > 60) {
            html += '<span class="stat-label">→ Classification:</span><span class="stat-value">Sheep 🐑 (Votes with majority)</span>';
        } else if (minorityPct > 40) {
            html += '<span class="stat-label">→ Classification:</span><span class="stat-value">Hot Takes 🔥 (Votes with minority)</span>';
        } else if (loneWolfPct > 30) {
            html += '<span class="stat-label">→ Classification:</span><span class="stat-value">Lone Wolf 🐺 (Votes for unpopular options)</span>';
        } else {
            html += '<span class="stat-label">→ Classification:</span><span class="stat-value">Balanced (No strong pattern)</span>';
        }
        html += '</div>';
        html += '</section>';
    }
    
    html += '<section><h3>📝 ALL VOTES</h3>';
    for (let pollData of stats.answers_by_poll) {
        const tags = [];
        if (pollData.was_majority) tags.push('MAJ');
        if (pollData.was_minority) tags.push('MIN');
        if (pollData.was_lone_wolf) tags.push('LONE');
        const tagStr = tags.length > 0 ? ' [' + tags.join(', ') + ']' : '';
        html += `<div class="stat-row"><span class="stat-label">Q: ${pollData.question}</span></div>`;
        html += `<div class="stat-row" style="padding-left: 20px;"><span class="stat-label">A: ${pollData.user_answer} (${pollData.answer_vote_count}/${pollData.total_votes} votes)${tagStr}</span></div>`;
    }
    html += '</section>';
    
    statsDiv.innerHTML = html;
    document.getElementById('individual-loading').style.display = 'none';
    document.getElementById('individual-content').style.display = 'block';
}

window.addEventListener('DOMContentLoaded', () => {
    loadOverview();
    loadPolls();
});

