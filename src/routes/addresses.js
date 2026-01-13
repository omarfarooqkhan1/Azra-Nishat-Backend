const express = require('express');
const {
    getAddresses,
    getAddress,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} = require('../controllers/addressController');

const router = express.Router();

const passport = require('passport');
const protect = passport.authenticate('jwt', { session: false });

router.use(protect);

router
    .route('/')
    .get(getAddresses)
    .post(createAddress);

router
    .route('/:id')
    .get(getAddress)
    .put(updateAddress)
    .delete(deleteAddress);

router.patch('/:id/default', setDefaultAddress);

module.exports = router;
