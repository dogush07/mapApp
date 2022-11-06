'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const buttonGetToCurrentLocation = document.querySelector('.sendMeHome');
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lang]
    this.distance = distance; // in km
    this.duration = duration; // in h
  }
  _setDescription() {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    this.description = `${this.type} on ${months[this.date.getMonth()]} ${
      this.date.getDate() + 1
    }`;
  }
}

class Running extends Workout {
  type = 'Running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.candace = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    //min/km;
    console.log(this);
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'Cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const run1 = new Running([35, 45], 10.5, 80.5, 180);
const cycle = new Running([55, 66], 10.5, 80.5, 180);

class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getPosition();
    this._getWorkouts();
    form.addEventListener('submit', this._newWorkOut.bind(this));
    containerWorkouts.addEventListener('click', this._formOnClick.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    buttonGetToCurrentLocation.addEventListener(
      'click',
      this._sendHome.bind(this)
    );
  }
  _getWorkouts() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
  }
  _renderStoredWorkOuts() {
    this.#workouts.forEach(i => {
      this._renderWorkout(i);
      this._renderWorkoutMarker(i);
    });
  }
  _sendHome() {
    console.log(this.#workouts);
    let buttonClicked = true;
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.#map.setView([lat, lng], 13, {
          animate: true,
          pan: {
            duration: 2,
          },
        });
        this.#map.on('moveend', () => {
          if (!buttonClicked) return;
          const tempMarker = L.marker([lat, lng])
            .addTo(this.#map)
            .bindPopup(`This is your current location📍`)
            .openPopup();
          setTimeout(() => {
            this.#map.removeLayer(tempMarker);
          }, 1500);
          buttonClicked = false;
        });
      },

      () => alert('error while getting current location pls check your browser')
    );
  }
  _formOnClick(event) {
    const currentElement = event.target.closest('.workout');
    if (!currentElement) return;
    const clickedElement = currentElement.getAttribute('data-id');
    const workOut = this.#workouts.find(i => i.id === clickedElement);
    const coords = workOut.coords;
    console.log(workOut);
    this._moveTo(coords);
  }
  _getPosition() {
    navigator.geolocation.getCurrentPosition(
      this._loadMap.bind(this),

      function () {
        alert('cannot get your position');
      }
    );
  }
  _moveTo(coords) {
    // const [lat, lng] = coords;
    this.#map.setView(coords, 13, {
      animate: true,
      pan: { duration: 2 },
    });
  }
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    console.log(latitude);
    console.log(longitude);
    const coords = [latitude, longitude];
    console.log(`Setting map`);
    this.#map = L.map('map').setView(coords, 13);
    console.log(`Map set`);
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    /**
     * below function will call the show form method and pass map event variable we then will set a private
     * property to it so that we can use to get coords in other functions from this evet
     * this is only done to abstract the parts of codes to individual functions
     * in line 175, we get the coords from this mapEvent,
     *
     */
    this.#map.on('click', this._showForm.bind(this));
    this._renderStoredWorkOuts();
  }
  _showForm(mapE) {
    console.log(mapE);
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkOut(event) {
    //Helper function to check if inputs are integer
    const validateInputs = (...inputs) => inputs.every(i => Number.isFinite(i));
    //Helper function to check if all given values are greater than 0
    const allPositive = (...inputs) => inputs.every(i => i > 0);
    event.preventDefault();
    // get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    //if workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validateInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive number');
      workout = new Running([lat, lng], distance, duration, cadence);
    }
    //if workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      if (
        !validateInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive number');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //Add new object to the workout array
    this.#workouts.push(workout);

    console.log(workout);
    //Clear inputs
    this._hideForm();
    const popUpCoords = [lat, lng];
    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    this._setLocalStorage();
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputElevation.value =
      inputCadence.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }
  _renderWorkoutMarker(workout) {
    console.log(
      `${workout.type[0].toLowerCase()}${workout.type.slice(1)}-popup`
    );
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type[0].toLowerCase()}${workout.type.slice(
            1
          )}-popup`,
        })
      )
      .setPopupContent(workout.description + '')
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `
        <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'Running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
        `;
    if (workout.type === 'Running') {
      html += `          
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">spm</span>
            </div>
        </li>
  `;
    }
    if (workout.type === 'Cycling') {
      html += `          
            <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
            </div>
            </li>
    `;
    }
    form.insertAdjacentHTML('afterend', html);
  }
}

const app = new App();
