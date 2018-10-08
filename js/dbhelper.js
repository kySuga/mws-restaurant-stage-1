/**
 * Credit and huge shout out goes to Elisa Romondia, Lorenzo Zaccagnini, Doug Brown, among
 * others for their webinars. Other resources include MDN, W3C, the slack community, and
 * various other random links from googling.
 **/

/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/`;
  }

  /**
   * Add idb
   **/
    static dbPromise() {
      return idb.open('restaurant-db', 3, upgradeDb => {
        switch (upgradeDb.replaceVersion) {
          case 0:
            const restaurantStore = upgradeDb.createObjectStore('restaurants', {
              keyPath: 'id'
            }); // creates restaurant object store
            restaurantStore.createIndex('by-address', 'address'); // creates index for restaurant in relation to restaurant address
            restaurantStore.createIndex('by-name', 'name'); // creates index for restaurant in relation to restaurant name
          case 1:
            const reviewsStore = upgradeDb.createObjectStore('reviews', {
              keyPath: 'id'
            }); //creates reviews object store
            reviewsStore.createIndex('restaurant', 'restaurant_id'); // creates index for reviews in relation to restaurant id
        }
      });
    }


    // fetch restaurant data and put it in objectStore
    static fetchRestaurantsForCache() {
      return fetch(DBHelper.DATABASE_URL + 'restaurants')
        .then(response => response.json())
        .then(restaurants => {
          return this.dbPromise()
            .then(db => {
              const tx = db.transaction('restaurants', 'readwrite');
              let restaurantStore = tx.objectStore('restaurants');
              restaurants.forEach(restaurant => restaurantStore.put(restaurant));

              return tx.complete.then(() => Promise.resolve(restaurants));
            });
        });
    }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback, id) {
    let restaurantInfo;
    const contentTransfer = DBHelper.DATABASE_URL + 'restaurants';
    if (!id) {
      restaurantInfo = `${contentTransfer}`;
    } else {
      restaurantInfo = `${contentTransfer}/${id}`;
    }
    fetch(restaurantInfo)
      .then(response => {
        response.json()
        .then(restaurants => {
          console.log("restaurants JSON: ", restaurants);
          callback(null, restaurants);
        });
      })
      .catch(error => {
        callback(`Request failed. Failed due to following error: ${error}`, null);
      });
  }

/**
 * Favorite Status of restaurants
 **/
 static updateFavoriteStatus(restaurantId, isFavorite) {

   fetch(`http://localhost:1337/restaurants/${restaurantId}/?is_favorite=${isFavorite}`, {
     method: 'PUT'
   })
   .then(() => {
     this.dbPromise()
     .then(db => {
       const tx = db.transaction('restaurants', 'readwrite');
       const restaurantsStore = tx.objectStore('restaurants');
       restaurantsStore.get(restaurantId)
       .then(restaurant => {
         restaurant.is_favorite = isFavorite;
         restaurantsStore.put(restaurant);
       });
     })
   })
 }



  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
   // Added if statement stating if photograph is not assigned restaurant.photograph
   // then return the noimage.png, else return the assigned restaurant.photograph
  static imageUrlForRestaurant(restaurant) {
    if (!restaurant.photograph) {
      return (`/img/noimage.png`);
    } else {
    return (`/img/${restaurant.photograph}.jpg`);
    }
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }

  /**
   * Fetch all reviews
   **/
   static storeIndexedDB(table, objects) {
     this.dbPromise.then(function(db) {
       if (!db) return;

       let tx = db.transaction(table, 'readwrite');
       const store = tx.objectStore(table);
       if (Array.isArray(objects)) {
         objects.forEach(function(object) {
           store.put(object);
         });
       } else {
         store.put(objects);
       }
     });
   }


// returns reviews and stores them in indexedDB
  static getStoredObjectById(table, idx, id) {
    return this.dbPromise()
      .then(function(db) {
        if (!db) return;

        const store = db.transaction(table).objectStore(table);
        const indexId = store.index(idx);
        return indexId.getAll(id);
      });
  }

  /**
   * Fetch all reviews for a restaurant by the restaurant id
   **/
  static fetchRestaurantReviews(id) {
    return fetch(`${DBHelper.DATABASE_URL}reviews/?restaurant_id=${id}`)
    .then(response => response.json())
    .then(reviews => {
      this.dbPromise()
      .then(db => {
        if (!db) return;

        let tx = db.transaction('reviews', 'readwrite');
        const store = tx.objectStore('reviews');
        if (Array.isArray(reviews)) {
          reviews.forEach(function(review) {
            store.put(review);
          });
        } else {
          store.put(reviews);
        }
      });
      console.log('reviews are: ', reviews);
      return Promise.resolve(reviews);
    })
    .catch(error => {
      return DBHelper.getStoredObjectById('reviews', 'restaurant', id)
      .then((storedReviews) => {
        return Promise.resolve(storedReviews);
      })
    });
  }

  // Add the review
  static addReview(review) {
    let whenOffline_obj = {
      name: 'addReview',
      data: review,
      object_type: 'review'
    };

    console.log('addReview output: ', addReview);
    // checking to see if online
    if (!navigator.online && (whenOffline_obj.name === 'addReview')) {
       DBHelper.updateDataOnline(whenOffline_obj);
       return;
    }
    let reviewSend = {
      "name": review.name,
      "rating": parseInt(review.rating),
      "comments": review.comments,
      "restaurant_id": parseInt(review.restaurant_id)
    };
    console.log('reviewSent output: ', reviewSend);
    let fetch_options = {
      method: 'POST',
      body: JSON.stringify(reviewSend),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    };
    fetch(`http://localhost:1337/reviews`, fetch_options)
      .then((response) => {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.indexOf('application/json') !== -1) {
        return response.json();
      } else {
        return 'API call failed'
      }})
      .then((data) => {console.log(`Fetch was a hit!`)})
      .catch(error => console.log('Ruh roh, here is the error: ', error));
  }

  static updateDataOnline(whenOffline_obj) {
    console.log('whenOffline Object ', whenOffline_obj);
    localStorage.setItem('data', JSON.stringify(whenOffline_obj.data));
    console.log(`Local Storage: ${whenOffline_obj.object_type} stored`);
    window.addEventListener('online', (event) => {
      console.log('Das Browser is online');
      let data = JSON.parse(localStorage.getItem('data'));
      [...document.querySelectorAll(".reviews_offline")] // check for reviews_offline
      .forEach(el => {
        el.classList.remove("reviews_offline")
        el.querySelector(".offline_label").remove()
      });
      if (data !== null) {
        console.log(data);
        if (whenOffline_obj.name === 'addReview') {
          DBHelper.addReview(whenOffline_obj.data);
        }

        localStorage.removeItem('data');
        console.log(`Local Storage: ${whenOffline_obj.object_type} removed`);
      }
    });
  }

}
