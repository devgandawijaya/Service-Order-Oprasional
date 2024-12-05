const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const path = require("path");


router.get("/retrivetoken", userController.getTokens);
router.post("/v1.0/access-token/b2b", userController.postTokens);
router.post("/v1.0/mobile-teknisi/send/job", userController.getOrders);
router.get("/ordertoserver",userController.getOrderToServer);
router.post("/v1.0/mobile-teknisi/vendor/non-cluster", userController.postNonCluster);
router.post("/v1.0/mobile-teknisi/master/vendor", userController.postMasterVendor);
router.put("/v1.0/mobile-teknisi/update/master/vendor", userController.postUpdateVendor);
router.get("/v1.0/mobile-teknisi/inquery/password", userController.getInqueryPasswords);

router.use((req, res) => {
    res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

module.exports = router;