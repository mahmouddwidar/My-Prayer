document.addEventListener('DOMContentLoaded', () => {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(onSuccess, onError);
    } else {
        alert('Geolocation is not supported by your browser');
    }

    function onSuccess(position) {
        const { latitude, longitude } = position.coords;
        fetchCountry(latitude, longitude).then(countryCode => {
            const method = getMethodByCountry(countryCode);
            fetchPrayerTimes(latitude, longitude, method);
        }).catch(error => {
            console.error('Error getting country:', error);
            alert('Unable to determine your country');
        });
    }

    function onError(error) {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location');
    }

    function fetchCountry(latitude, longitude) {
        const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
        return fetch(url)
            .then(response => response.json())
            .then(data => data.countryCode)
            .catch(error => {
                console.error('Error fetching country data:', error);
                throw error;
            });
    }

    function getMethodByCountry(countryCode) {
        const methods = {
            'AE': 16,
            'EG': 5,
            'IN': 1,
            'IQ': 3,
            'IR': 7,
            'KW': 9,
            'MY': 3,
            'PK': 1,
            'QA': 10,
            'SA': 4,
            'SG': 11,
            'TR': 13,
            'US': 2,
            'FR': 12,
            'RU': 14
        };
        return methods[countryCode] || 3; // Default to Muslim World League
    }

    function fetchPrayerTimes(latitude, longitude, method) {
        const url = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=${method}`;
        fetch(url)
            .then(response => response.json())
            .then(data => {
                const timings = data.data.timings;
                const hijriDate = data.data.date.hijri;

                const currentTime = new Date();
                const prayerTimes = [
                    { name: 'Fajr', time: convertTo12HourFormat(timings.Fajr) },
                    { name: 'Sunrise', time: convertTo12HourFormat(timings.Sunrise) },
                    { name: 'Dhuhr', time: convertTo12HourFormat(timings.Dhuhr) },
                    { name: 'Asr', time: convertTo12HourFormat(timings.Asr) },
                    { name: 'Maghrib', time: convertTo12HourFormat(timings.Maghrib) },
                    { name: 'Isha', time: convertTo12HourFormat(timings.Isha) }
                ];

                // Convert prayer times to Date objects for comparison
                prayerTimes.forEach(prayer => {
                    const [time, period] = prayer.time.split(' ');
                    const [hours, minutes] = time.split(':');
                    let hour = parseInt(hours);
                    if (period.toLowerCase() === 'pm' && hour !== 12) {
                        hour += 12;
                    } else if (period.toLowerCase() === 'am' && hour === 12) {
                        hour = 0;
                    }
                    prayer.date = new Date(currentTime);
                    prayer.date.setHours(hour);
                    prayer.date.setMinutes(parseInt(minutes));
                    prayer.date.setSeconds(0);
                });

                updatePrayerTimes(prayerTimes);

                setInterval(() => {
                    updatePrayerTimes(prayerTimes);
                }, 1000);

                document.getElementById('day').textContent = data.data.date.gregorian.weekday.en;
                document.getElementById('date').textContent = hijriDate.day;
                document.getElementById('month').textContent = hijriDate.month.en;
            })
            .catch(error => console.error('Error fetching prayer times:', error));
    }

    function updatePrayerTimes(prayerTimes) {
        const currentTime = new Date();
        
        let nextPrayer, previousPrayer;
        for (let i = 0; i < prayerTimes.length; i++) {
            if (currentTime < prayerTimes[i].date) {
                nextPrayer = prayerTimes[i];
                previousPrayer = i === 0 ? prayerTimes[prayerTimes.length - 1] : prayerTimes[i - 1];
                break;
            }
        }

        if (!nextPrayer) {
            nextPrayer = prayerTimes[0];
            previousPrayer = prayerTimes[prayerTimes.length - 1];
        }

        document.getElementById('previous-time').textContent = `${previousPrayer.time}`;
        document.getElementById('previousPrayer').textContent = `${previousPrayer.name}`;
        document.getElementById('next-time').textContent = `${nextPrayer.time}`;
        document.getElementById('nextPrayer').textContent = `${nextPrayer.name}`;

        updateProgressBar(currentTime, nextPrayer.date, previousPrayer.date);
    }

    function updateProgressBar(currentTime, nextPrayerTime, previousPrayerTime) {
        const timeDiff = nextPrayerTime - currentTime;
        const totalTime = nextPrayerTime - previousPrayerTime;
    
        const progressBar = document.querySelector('.progress-bar');
        const progress = 100 - ((timeDiff / totalTime) * 100);
    
        progressBar.style.width = `${progress}%`;
    
        const totalSeconds = Math.floor(timeDiff / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
    
        if (hours > 0) {
            progressBar.textContent = `${hours} hr ${minutes} min`;
        } else {
            progressBar.textContent = `${minutes} min`;
        }
    }
    

    function convertTo12HourFormat(time24) {
        const [hours, minutes] = time24.split(':');
        let period = 'AM';
        let hour = parseInt(hours);

        if (hour >= 12) {
            period = 'PM';
        }
        if (hour === 0) {
            hour = 12;
        } else if (hour > 12) {
            hour -= 12;
        }

        return `${hour}:${minutes} ${period}`;
    }
});
