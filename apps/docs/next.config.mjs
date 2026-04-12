import nextra from "nextra"

const withNextra = nextra({
  // Nextra 4 stable options (e.g. flexsearch: true)
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],

}

export default withNextra({nextConfig})
