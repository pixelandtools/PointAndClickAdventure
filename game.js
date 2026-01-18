document.addEventListener('DOMContentLoaded', () => {
    const gameView = document.getElementById('game-view');
    const cursor = document.getElementById('custom-cursor');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const clockDisplay = document.getElementById('game-clock');
    const targetDisplay = document.getElementById('target-display');
    const aboutBtn = document.getElementById('about-btn');
    const aboutModal = document.getElementById('about-modal');
    const closeBtn = document.querySelector('.close-btn');
    const verbs = document.querySelectorAll('.verb');
    const inventoryList = document.getElementById('inventory-list');

    let cursorX = window.innerWidth / 2;
    let cursorY = (window.innerHeight * 2 / 3) / 2;
    const step = 10;
    let gameActive = false;
    let timerInterval = null;
    let secondsElapsed = 0;

    let inventory = [];
    let selectedItemIndex = -1;

    function showModal(message) {
        const modalContent = aboutModal.querySelector('p');
        modalContent.innerText = message;
        aboutModal.style.display = 'block';
    }

    function updateInventoryUI() {
        inventoryList.innerHTML = '';
        inventory.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'inventory-item';
            if (index === selectedItemIndex) div.classList.add('selected');
            div.innerHTML = `<span>${index + 1}</span> ${item.name}`;
            div.onclick = () => selectItem(index);
            inventoryList.appendChild(div);
        });
    }

    function selectItem(index) {
        if (index >= 0 && index < inventory.length) {
            selectedItemIndex = index;
        } else {
            selectedItemIndex = -1;
        }
        updateInventoryUI();
    }

    function getElementAtCursor() {
        // We need to find the element under the custom cursor.
        // Since cursor is at (cursorX, cursorY) relative to viewport? 
        // No, cursorX/Y are absolute but we set cursor.style.left/top.
        // Let's use document.elementFromPoint.
        // But the cursor itself might be returned if not pointer-events: none.
        // It is pointer-events: none.
        const el = document.elementFromPoint(cursorX, cursorY);
        if (el && el.classList.contains('clickable')) {
            return el;
        }
        return null;
    }

    function updateClock() {
        const hrs = Math.floor(secondsElapsed / 3600).toString().padStart(2, '0');
        const mins = Math.floor((secondsElapsed % 3600) / 60).toString().padStart(2, '0');
        const secs = (secondsElapsed % 60).toString().padStart(2, '0');
        clockDisplay.innerText = `${hrs}:${mins}:${secs}`;
    }

    function startTimer() {
        if (timerInterval) return;
        timerInterval = setInterval(() => {
            secondsElapsed++;
            updateClock();
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    function resetTimer() {
        stopTimer();
        secondsElapsed = 0;
        updateClock();
    }

    function updateCursorPosition() {
        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;
        
        // Update target display
        const target = getElementAtCursor();
        targetDisplay.innerText = target ? target.id : '';
    }

    // Initial position
    function resetCursor() {
        const rect = gameView.getBoundingClientRect();
        cursorX = rect.width / 2;
        cursorY = rect.height / 2;
        updateCursorPosition();
    }
    resetCursor();

    // Keyboard controls for cursor
    window.addEventListener('keydown', (e) => {
        // Close modal on Escape
        if (e.key === 'Escape') {
            aboutModal.style.display = 'none';
        }

        // Hotkeys for verbs - allow even if game not active? Usually not.
        if (gameActive) {
            const key = e.key.toLowerCase();
            // Numbers for inventory
            if (key >= '1' && key <= '9') {
                selectItem(parseInt(key) - 1);
            }
            verbs.forEach(verb => {
                if (verb.getAttribute('data-key') === key) {
                    verb.click();
                }
            });
        }

        if (!gameActive) return;

        const rect = gameView.getBoundingClientRect();

        switch (e.key) {
            case 'ArrowUp':
                cursorY = Math.max(0, cursorY - step);
                e.preventDefault();
                break;
            case 'ArrowDown':
                cursorY = Math.min(rect.height, cursorY + step);
                e.preventDefault();
                break;
            case 'ArrowLeft':
                cursorX = Math.max(0, cursorX - step);
                e.preventDefault();
                break;
            case 'ArrowRight':
                cursorX = Math.min(rect.width, cursorX + step);
                e.preventDefault();
                break;
        }
        updateCursorPosition();
    });

    // Verb interaction
    verbs.forEach(verb => {
        verb.addEventListener('click', () => {
            if (!gameActive) return;
            const action = verb.getAttribute('data-key');
            const target = getElementAtCursor();
            
            console.log(`Action: ${verb.innerText.trim()} on ${target ? target.id : 'nothing'}`);

            if (target) {
                if (action === 'l' || action === 'u') { // Look or Use
                    if (target.id === 'sink' && action === 'l') {
                        showModal("disgusting, needs a cleanup");
                    } else if (target.id === 'window' && action === 'l') {
                        showModal("nice view, cars and dirt on the streets");
                    } else if (target.id === 'plant' && action === 'l') {
                        document.getElementById('key').style.display = 'block';
                    } else if (target.id === 'tv') {
                        secondsElapsed += 300; // Add 5 minutes
                        updateClock();
                        showModal("The news get worse every day");
                    } else if (target.id === 'couch') {
                        secondsElapsed += 10800; // Add 3 hours
                        updateClock();
                        showModal("Goodnight");
                    } else if (target.id === 'desk') {
                        const selectedItem = inventory[selectedItemIndex];
                        if (selectedItem && selectedItem.id === 'beer') {
                            showModal("Too cold");
                            inventory.splice(selectedItemIndex, 1);
                            selectedItemIndex = -1;
                            updateInventoryUI();
                        } else {
                            showModal("Where is the beer");
                        }
                    }
                } else if (action === 'b') { // Break
                    if (target.id === 'sink') {
                        target.classList.add('broken');
                        showModal("nice job");
                    }
                } else if (action === 'p') { // Pickup
                    if (target.id === 'key' && target.style.display === 'block') {
                        target.style.display = 'none';
                        inventory.push({ id: 'key', name: 'Key' });
                        updateInventoryUI();
                    } else if (target.id === 'beer' && target.style.display === 'block') {
                        target.style.display = 'none';
                        document.getElementById('fridge').classList.remove('open');
                        inventory.push({ id: 'beer', name: 'Beer' });
                        updateInventoryUI();
                    }
                } else if (action === 'o') { // Open
                    if (target.id === 'door') {
                        const selectedItem = inventory[selectedItemIndex];
                        if (selectedItem && selectedItem.id === 'key') {
                            stopTimer();
                            showModal(`You escaped the room in ${clockDisplay.innerText}`);
                            gameActive = false;
                        } else {
                            showModal("You need the key to open the door");
                        }
                    } else if (target.id === 'fridge') {
                        target.classList.add('open');
                        const beer = document.getElementById('beer');
                        // Only show beer if it's not already in inventory or dropped? 
                        // The requirement says "show a single beer"
                        // If it's not in inventory and not hidden, it must be in fridge.
                        // Actually, if we haven't picked it up, it's hidden (display: none).
                        const hasBeer = inventory.find(i => i.id === 'beer');
                        if (!hasBeer) {
                            beer.style.display = 'block';
                        }
                    }
                }
            }

            verb.style.backgroundColor = '#555';
            setTimeout(() => {
                verb.style.backgroundColor = '';
            }, 100);
        });
    });

    // Start / Restart
    startBtn.addEventListener('click', () => {
        gameActive = true;
        startBtn.disabled = true;
        restartBtn.disabled = false;
        startTimer();
        console.log('Game Started');
    });

    restartBtn.addEventListener('click', () => {
        gameActive = false;
        startBtn.disabled = false;
        restartBtn.disabled = true;
        resetTimer();
        resetCursor();
        targetDisplay.innerText = '';
        
        // Reset game state
        inventory = [];
        selectedItemIndex = -1;
        updateInventoryUI();
        document.getElementById('sink').classList.remove('broken');
        document.getElementById('fridge').classList.remove('open');
        document.getElementById('key').style.display = 'none';
        document.getElementById('beer').style.display = 'none';
        
        console.log('Game Restarted');
    });

    // About Modal
    aboutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showModal("Classic Escape Room v1");
    });

    closeBtn.addEventListener('click', () => {
        aboutModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === aboutModal) {
            aboutModal.style.display = 'none';
        }
    });
});
