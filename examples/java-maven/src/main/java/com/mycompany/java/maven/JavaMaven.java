package com.mycompany.java.maven;

/**
 *
 * @author Lagoni
 */
public class JavaMaven {
    public static void main(String[] args) {
        UserSignedUp payload = new UserSignedUp();
        payload.setDisplayName("Lagoni");
        payload.setEmail("lagoni@lagoni.com");
        System.out.println("User was: " + payload.marshal());
    }
}
