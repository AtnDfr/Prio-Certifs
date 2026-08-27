// Stub pour les tests Jest : le vrai "@microsoft/sp-http" tire en interne des
// modules internes Microsoft (ex. @msinternal/ecs-flight) qui n'existent que
// dans l'environnement de build/hebergement SPFx reel, pas sous Node/Jest.
// Nos repositories n'utilisent que SPHttpClient.configurations.v1 comme jeton
// opaque transmis a spHttpClient.get/post (entierement simules dans les
// tests) : cette valeur n'a besoin d'etre que non-nulle.
module.exports = {
  SPHttpClient: {
    configurations: { v1: "v1" },
  },
};
