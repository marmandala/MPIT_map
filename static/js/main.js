const map = L.map('map').setView([51.6644, 39.1875], 12); // Центр Воронежа

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CartoDB</a>'
}).addTo(map);

let routeLayer;
let markers = [];
let cachedRoutes = {};

const tagInfo = {
    park: {
        image: 'static/2.png',
        description: 'Маршрут по паркам города'
    },
    square: {
        image: 'static/2.png',
        description: 'Маршрут по площадям города'
    },
    nicitin: {
        image: 'static/nicitin.png',
        description: 'И. С. Никитин'
    }
};

function createRouteButtons() {
    const routeList = document.getElementById('route-list');

    fetch('/get_points')
        .then(response => response.json())
        .then(points => {
            const tags = [...new Set(points.map(point => point.tag))];

            tags.forEach(tag => {
                const button = document.createElement('button');
                button.classList.add('route-item');
                button.innerHTML = `
                    <img src="${tagInfo[tag].image}" alt="${tag}">
                    <span>${tagInfo[tag].description}</span>
                `;
                button.onclick = function() {
                    getRoute(tag, points);
                };
                routeList.appendChild(button);
            });
        })
        .catch(error => console.error('Error loading points:', error));
}

createRouteButtons();

function showRouteOnMap(points) {
    if (routeLayer) {
        routeLayer.remove();
    }

    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    const routeCoordinates = points.map(point => [point.lat, point.lon]);

    points.slice(1, points.length - 1).forEach(point => addTextMarker(point.lat, point.lon, point.name, point.description, point.image, point.audio));

    if (cachedRoutes[routeCoordinates.join('|')]) {
        const routeCoords = cachedRoutes[routeCoordinates.join('|')];
        const latLngs = routeCoords.map(function(coord) {
            return [coord[1], coord[0]];
        });

        routeLayer = L.polyline(latLngs, { color: "rgb(79, 85, 115)", weight: 4 }).addTo(map);
        map.fitBounds(routeLayer.getBounds());
    } else {
        $.get(`/route?points=${routeCoordinates.map(coord => coord.join(',')).join('|')}`, function(data) {
            if (data.routes && data.routes.length > 0) {
                const routeCoords = data.routes[0].geometry.coordinates;
                const latLngs = routeCoords.map(function(coord) {
                    return [coord[1], coord[0]];
                });

                routeLayer = L.polyline(latLngs, { color: "rgb(79, 85, 115)", weight: 4 }).addTo(map);
                map.fitBounds(routeLayer.getBounds());

                cachedRoutes[routeCoordinates.join('|')] = routeCoords;
            }
        });
    }
}

let currentAudio = null;
let progressBarContainer = null;
let progressElement = null;
let progressInterval = null;
let isPaused = false;

function addTextMarker(lat, lon, name, description, image, audioUrl) {
    const tempDiv = document.createElement('div');
    tempDiv.className = 'text-marker';
    tempDiv.style.position = 'absolute';
    tempDiv.style.visibility = 'hidden';

    tempDiv.innerHTML = `
        <div class="marker-text">
            <img src="${image}" alt="${name}" style="max-width: 100%; height: auto; margin-bottom: 10px;">
            <strong>${name}</strong><br>
            <p>${description}</p> <!-- сюда добавляем текст -->
            <button class="play-audio" onclick="toggleAudio('${audioUrl}', this, '${name}')">
                <i class="fas fa-play"></i> Старт
            </button>
        </div>
    `;

    document.body.appendChild(tempDiv);

    requestAnimationFrame(() => {
        const pElement = tempDiv.querySelector('p');
        if (pElement) {
            const pHeight = pElement.offsetHeight;
            console.log(`Высота <p> маркера "${name}": ${pHeight}px`);
        }

        const fixedWidth = 200;
        let fixedHeight = 90;
        

        const iconSize = [fixedWidth, fixedHeight];
        const iconAnchor = [fixedWidth / 2, fixedHeight];

        const icon = L.divIcon({
            className: 'text-marker',
            html: tempDiv.innerHTML,
            iconSize: iconSize,
            iconAnchor: iconAnchor
        });

        const marker = L.marker([lat, lon], { icon: icon }).addTo(map);
        markers.push(marker);

        const button = marker._icon.querySelector('button.play-audio');
        if (button) {
            button.removeEventListener('click', toggleAudio);
            button.addEventListener('click', function() {
                toggleAudio(audioUrl, this, name);
            });
        }

        document.body.removeChild(tempDiv);
    });

    setTimeout(() => {
        const existingMarker = markers.find(m => m._icon && m._icon.innerText === name);
        if (existingMarker) {
            console.log(name)
            const updatedHeight = name === 'Памятник Никитину' ? 90 : 90; 
            existingMarker.setIcon(L.divIcon({
                className: 'text-marker',
                html: tempDiv.innerHTML,
                iconSize: [200, updatedHeight],
                iconAnchor: [100, updatedHeight / 2]
            }));
        }
    }, 100);
}


async function toggleAudio(audioUrl, button, name) {
    currentAudio = new Audio(audioUrl);
            currentAudio.onended = function() {
                button.innerHTML = '<i class="fas fa-play"></i> Старт';
                isPaused = false;
                updateProgressBar(0);
                clearInterval(progressInterval);
            };
    if (currentAudio && !currentAudio.paused) {
        currentAudio.pause();
        button.innerHTML = '<i class="fas fa-play"></i> Старт';
        isPaused = true;
    } else {
        try {
            if (currentAudio) {
                currentAudio.pause();
            }

            currentAudio = new Audio(audioUrl);
            currentAudio.onended = function() {
                button.innerHTML = '<i class="fas fa-play"></i> Старт';
                isPaused = true;
                updateProgressBar(0);
                clearInterval(progressInterval);
            };

            await currentAudio.play();

            button.innerHTML = '<i class="fas fa-pause"></i> Остановить';
            showProgressBar(name);
            isPaused = false;
            updateProgressBar();

        } catch (error) {
            console.error('Ошибка при воспроизведении аудио:', error);
            button.innerHTML = '<i class="fas fa-play"></i> Старт';
            isPaused = true;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('audioToggleButton');
    button.innerHTML = '<i class="fas fa-pause"></i> Остановить';
});



function showProgressBar(title) {
    if (!progressBarContainer) {
        progressBarContainer = document.createElement('div');
        progressBarContainer.classList.add('progress-bar-container');
        document.body.appendChild(progressBarContainer);
        progressBarContainer.innerHTML = `
            <div class="audio-controls">
                <button id="startButton" onclick="toggleAudio(currentAudio.src, this)">Старт</button>
                <span class="close-btn" onclick="closeProgressBar()">
                    <i class="fas fa-times"></i> <!-- Это иконка крестика -->
                </span>
            </div>
            <div class="progress-bar">
                <div class="progress"></div>
            </div>
            <div class="time-display">
                <span class="point-title">${title}</span> <!-- Здесь будет отображаться название точки -->
                <span class="current-time">0:00</span> / <span class="duration-time">0:00</span>
            </div>
        `;
        progressElement = progressBarContainer.querySelector('.progress');
        startButton = progressBarContainer.querySelector('#startButton');
        titleDisplay = progressBarContainer.querySelector('.point-title');
    }
    progressBarContainer.classList.add('active');
    titleDisplay.textContent = title || 'Неизвестная точка';
    startButton.textContent = 'Стоп';
}

function closeProgressBar() {
    if (progressBarContainer) {
        progressBarContainer.classList.remove('active');
    }
    if (startButton) {
        startButton.textContent = 'Старт';
    }
}


function updateProgressBar() {
    if (!progressElement || !currentAudio) return;

    progressInterval = setInterval(function() {
        const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
        progressElement.style.width = `${progress}%`;

        const currentTimeFormatted = formatTime(currentAudio.currentTime);
        const durationFormatted = formatTime(currentAudio.duration);

        const currentTimeDisplay = progressBarContainer.querySelector('.current-time');
        const durationDisplay = progressBarContainer.querySelector('.duration-time');

        if (currentTimeDisplay && durationDisplay) {
            currentTimeDisplay.textContent = currentTimeFormatted;
            durationDisplay.textContent = durationFormatted;
        }

        if (currentAudio.ended) {
            clearInterval(progressInterval);
            hideProgressBar();
            const playButton = document.querySelector('button.play-audio');
            if (playButton) {
                playButton.innerHTML = '<i class="fas fa-play"></i> Старт';
            }
        }
    }, 100);
}

function hideProgressBar() {
    if (progressBarContainer) {
        progressBarContainer.classList.remove('active');
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

function closeProgressBar() {
    if (currentAudio) {
        currentAudio.pause();
        clearInterval(progressInterval);
    }
    hideProgressBar();
}


let audioProgressInterval;
let isAudioPlaying = false;
let audioDuration = 0;
let currentTime = 0;
let isDragging = false;

function playAudio(audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play();
    isAudioPlaying = true;
    audioDuration = audio.duration;
    currentTime = 0;

    audioProgressInterval = setInterval(() => {
        if (isAudioPlaying) {
            currentTime = audio.currentTime;
            updateProgressBar(currentTime / audioDuration * 100);
        }
    }, 10);

    audio.onended = () => {
        isAudioPlaying = false;
        updateProgressBar(0);
        clearInterval(audioProgressInterval);
    };

    const stopButton = document.querySelector('.audio-controls button');
    stopButton.onclick = () => {
        audio.pause();
        isAudioPlaying = false;
        updateProgressBar(0);
        clearInterval(audioProgressInterval);
    };

    const progressBar = document.querySelector('.progress-bar');
    progressBar.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateTimeOnDrag(e);
    });

    progressBar.addEventListener('mousemove', (e) => {
        if (isDragging) {
            updateTimeOnDrag(e);
        }
    });

    progressBar.addEventListener('mouseup', () => {
        isDragging = false;
    });

    progressBar.addEventListener('mouseleave', () => {
        isDragging = false;
    });

    function updateTimeOnDrag(e) {
        const progressBarRect = progressBar.getBoundingClientRect();
        const x = e.clientX - progressBarRect.left;
        const progressPercentage = Math.min(Math.max(x / progressBarRect.width, 0), 1);
        const newTime = progressPercentage * audioDuration;
        audio.currentTime = newTime;
        updateProgressBar(progressPercentage * 100);
    }
}


function getMarkerScreenPosition(marker) {
    const point = map.latLngToContainerPoint(marker.getLatLng());
    return point;
}

function checkMarkerOverlapOnScreen(marker1, marker2) {
    const pos1 = getMarkerScreenPosition(marker1);
    const pos2 = getMarkerScreenPosition(marker2);

    const size1 = marker1.options.icon.options.iconSize;
    const size2 = marker2.options.icon.options.iconSize;

    const xOverlap = Math.abs(pos1.x - pos2.x) < (size1[0] + size2[0]) / 2;
    const yOverlap = Math.abs(pos1.y - pos2.y) < (size1[1] + size2[1]) / 2;

    return xOverlap && yOverlap;
}

function getRoute(tag, points) {
    const selectedPoints = points.filter(point => point.tag === tag);
    const startPoint = { lat: 51.661482, lon: 39.201172};
    const routePoints = [startPoint, ...selectedPoints, startPoint];

    showRouteOnMap(routePoints);
}

map.on('moveend', function() {
    checkMarkerOverlaps();
});

function checkMarkerOverlaps() {
    markers.forEach(marker => {
        let isOverlapping = false;

        markers.forEach(existingMarker => {
            if (existingMarker !== marker && checkMarkerOverlapOnScreen(marker, existingMarker)) {
                isOverlapping = true;
            }
        });

        if (isOverlapping) {
            if (!marker._isOverlapping) {
                marker.setIcon(L.divIcon({
                    className: 'overlap-marker',
                    html: marker._icon.innerHTML,
                    iconSize: [200, 90],
                    iconAnchor: [100, 90]
                }));
                marker._isOverlapping = true;
            }
        } else {
            if (marker._isOverlapping) {
                marker.setIcon(L.divIcon({
                    className: 'text-marker',
                    html: marker._icon.innerHTML,
                    iconSize: marker.options.icon.options.iconSize,
                    iconAnchor: marker.options.icon.options.iconAnchor
                }));
                marker._isOverlapping = false;
            }
        }
    });
}
