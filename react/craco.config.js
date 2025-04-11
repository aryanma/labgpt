module.exports = {
    webpack: {
        configure: {
            resolve: {
                fallback: {
                    url: false,
                    fs: false,
                    http: false,
                    https: false,
                    zlib: false,
                    canvas: false
                }
            }
        }
    }
}; 