import { Router } from 'express';
import * as citiesController from '../controllers/cities.controller';
import * as metroLinesController from '../controllers/metroLines.controller';
import * as stationsController from '../controllers/stations.controller';
import * as routesController from '../controllers/routes.controller';
import * as trainSightingsController from '../controllers/trainSightings.controller';

const router = Router();

// Cities
router.get('/cities', citiesController.getAllCities);
router.get('/cities/:cityId', citiesController.getCityById);

// Metro Lines
router.get('/lines', metroLinesController.getAllLines);
router.get('/lines-with-stations', metroLinesController.getLinesWithStations);
router.get('/lines/:id', metroLinesController.getLineById);

// Stations
router.get('/stations', stationsController.getAllStations);
router.get('/stations/nearby', stationsController.getNearbyStations);
router.get('/stations/:id', stationsController.getStationById);

// Routes
router.post('/routes/find', routesController.findRoute);

// Train Sightings (Crowdsourced Tracking)
router.post('/train-sightings', trainSightingsController.reportTrainSighting);
router.get('/train-sightings/recent', trainSightingsController.getRecentSightings);
router.get('/train-positions/:lineId', trainSightingsController.getTrainPositions);
router.get('/live-tracking/:origin/:destination', trainSightingsController.getLiveRouteTracking);

export default router;
