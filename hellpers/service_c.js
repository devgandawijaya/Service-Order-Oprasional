// pathHelper.js

const paths = {
    konfirmasi: {
        jobKonfirmasi: '/openapi/v1.0/mobile-teknisi/job/konfirmasi',
        jobList: '/openapi/v1.0/mobile-teknisi/job/list',
        jobDetail: '/openapi/v1.0/mobile-teknisi/job/detail',
    },
    auth: {
        login: '/openapi/v1.0/auth/login',
        logout: '/openapi/v1.0/auth/logout',
        refreshToken: '/openapi/v1.0/access-token/b2b'
    },
    client: {
        profile: '/openapi/v1.0/client/profile',
        updateProfile: '/openapi/v1.0/client/update-profile',
        deleteAccount: '/openapi/v1.0/client/delete-account'
    },
    nonCluster: {
        noncluster: '/openapi/v1.0/mobile-teknisi/vendor/non-cluster',
        inquiry:'/openapi/v1.0/mobile-teknisi/inquiry/password'
    }
};


module.exports = paths;
