const fs = require('fs');
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['sharp', 'onnxruntime-node'],
  // Remove rewrites as we're handling everything through the custom server
}

module.exports = nextConfig;
