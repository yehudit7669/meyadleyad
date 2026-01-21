// console.log("=".repeat(20))
// console.log("loadding env variables")
// console.log(import.meta.env)
// console.log("=".repeat(20))

export default {
    ...import.meta.env,
    API_URL: import.meta.env.VITE_API_URL || "https://meyadleyad.onrender.com/api",
}