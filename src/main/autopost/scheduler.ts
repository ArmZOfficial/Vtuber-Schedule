// Auto-post scheduling is not implemented yet.
// NOTE: previously this registered an empty `cron.schedule('* * * * *', ...)` job that
// ticked forever with nothing to do — removed until the feature actually exists.
// When implemented, re-add the `node-cron` import and register the real job here.
export function initScheduler() {
  // no-op for now
}
