export function scopeForCustomerView(view?: string) {
  return view === "mine" ? "my" : undefined;
}
