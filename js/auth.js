async function verificarAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return null;
    }
    return session.user;
}

async function fazerLogin(email, senha) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw error;
    return data;
}

async function fazerLogout() {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
}

async function getUsuario() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}
