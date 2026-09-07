"use client";

import { useState } from "react";
import { signIn, signUp, resetPassword, confirmResetPassword, confirmSignUp, autoSignIn } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export const LoginForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [buttonType, setButtonType] = useState("Sign In"); //string indicating button type,
    const [sysMessage, setSysMessage] = useState("");
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [passwordVisbility, setPasswordVisibility] = useState(false);
    const [confirmPasswordVisbility, setConfirmPasswordVisibility] = useState(false);
    const router = useRouter();

    // cognito returns a nextStep instead of completing every operation immediately.
    // buttonType is the small state machine that selects the fields and handler for that step.
    const handleSignIn = async () => {
        try {
            const { isSignedIn, nextStep } = await signIn({
                username: email,
                password: password
            });

            if (isSignedIn == true) {
                setSysMessage("Sign in successful! Redirecting...");
                router.push("/pwa/dashboard");
            } else if (nextStep.signInStep == "CONFIRM_SIGN_UP") {
                setSysMessage("A confirmation code has been sent to " + email + ".");
                setButtonType("Verify");
            }
        } catch (error) {
            if (error instanceof Error) {
                setSysMessage("Error: Incorrect email or password.");
            }
        }
    }

    const handleResetPassword = async () => {
        if (email == "") {
            setSysMessage("Error: Email cannot be blank.");
            return;
        }
        try {
            const { nextStep } = await resetPassword({
                username: email
            })
            if (nextStep.resetPasswordStep == "CONFIRM_RESET_PASSWORD_WITH_CODE") {
                setSysMessage("Confirmation code was sent to " + email + ".");
                setButtonType("Confirm Reset")
            } else if (nextStep.resetPasswordStep == "DONE") {
                setSysMessage("Password reset successful.");
                setButtonType("Sign In")
            }
        } catch (error) {
            if (error instanceof Error) {
                setSysMessage("Error: " + error.message);
            }
        }
    }

    const handleResetPasswordConfirmation = async () => {
        if (code == "") {
            setSysMessage("Error: Code cannot be blank.");
            return;
        }
        if (password == "") {
            setSysMessage("Error: Password cannot be blank.");
            return;
        }
        if (password !== confirmPassword) {
            setSysMessage("Error: Passwords do not match.");
            return;
        }
        try {
            await confirmResetPassword({
                username: email,
                confirmationCode: code,
                newPassword: password
            })
            setSysMessage("Password reset successful.");
            setButtonType("Sign In");
        } catch (error) {
            if (error instanceof Error) {
                setSysMessage("Error: " + error.message);
            }
        }

    }

    const handleSignUp = async () => {
        if (password == "") {
            setSysMessage("Error: Password cannot be blank.");
            return;
        }

        if (password !== confirmPassword) {
            setSysMessage("Error: Passwords do not match.");
            return;
        }

        try {
            const { nextStep } = await signUp({
                username: email,
                password: password,
                options: {
                    userAttributes: { email: email },
                    autoSignIn: true
                },
            });

            if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
                setSysMessage("A confirmation code has been sent to " + email + ".");
                setButtonType("Verify");
            } else if (nextStep.signUpStep === "DONE") {
                setSysMessage("Sign up successful! Please log in to continue.")
            }
        } catch (error) {
            if (error instanceof Error) {
                setSysMessage("Error: " + error.message + ".");
            }
        }
    }

    const handleSignUpConfirmation = async () => {
        try {
            await confirmSignUp({
                username: email,
                confirmationCode: code
            });

            setSysMessage("Signing in...");
            const { isSignedIn } = await autoSignIn();
            if (isSignedIn == true) {
                setSysMessage("Sign in successful! Redirecting..."); //later, user will be redirected.
                router.push("/pwa/dashboard");
            }
        } catch (error) {
            if (error instanceof Error) {
                setSysMessage("Error: " + error.message);
            }
        }
    }

    const handleButton = async () => {
        // prevent duplicate cognito requests while the current step is in flight.
        if (isLoading == true) {
            return;
        } else {
            setSysMessage("");
            setIsLoading(true);

            try {
                switch (buttonType) {
                    case "Reset Password":
                        await handleResetPassword();
                        break;
                    case "Confirm Reset":
                        await handleResetPasswordConfirmation();
                        break;
                    case "Sign In":
                        setSysMessage("Signing in...");
                        await handleSignIn();
                        break;
                    case "Sign Up":
                        await handleSignUp();
                        break;
                    case "Verify":
                        await handleSignUpConfirmation();
                }
            } finally {
                setIsLoading(false);
            }
        }

    }


    return (
        <>
            <div className="flex flex-col items-center justiy-center bg-zinc-900 w-full max-w-md mx-4 rounded-md" role="main" aria-labelledby="login-title">
                <form className="flex flex-col items-center justify-center w-full p-5" onSubmit={(e) => { e.preventDefault(); handleButton(); }} aria-label="Login form">
                    <div className="w-full">
                        <label htmlFor="email-input" className="text-sm">Email</label>
                        <input id="email-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={buttonType == "Verify" || buttonType == "Confirm Reset"} autoComplete="email" className="mb-4 p-2 rounded-md bg-zinc-800 text-white w-full disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Email address" />
                    </div>

                    {buttonType !== "Reset Password" && buttonType != "Verify" && (
                        <>
                            <div className="w-full">
                                <label htmlFor="password-input" className="text-sm">{buttonType == "Confirm Reset" ? "New Password" : "Password"}</label>
                                <div className="relative mb-4">
                                    <input id="password-input" type={passwordVisbility == true ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={buttonType == "Confirm Reset" ? "new-password" : "current-password"} className="p-2 rounded-md bg-zinc-800 text-white w-full" aria-label={buttonType == "Confirm Reset" ? "New password" : "Password"} />
                                    <button type="button" className="absolute inset-y-0 end-0 flex items-center z-20 text-zinc-500 p-2 hover:text-zinc-400" onClick={() => setPasswordVisibility(!passwordVisbility)} aria-label={passwordVisbility ? "Hide password" : "Show password"} aria-pressed={passwordVisbility}>
                                        {passwordVisbility == true ? (
                                            <EyeOff size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {(buttonType == "Sign Up" || buttonType == "Confirm Reset") && (
                        <>
                            <div className="w-full">
                                <label htmlFor="confirm-password-input" className="text-sm">Confirm {buttonType == "Confirm Reset" ? "New " : ""}Password</label>
                                <div className="relative mb-4">
                                    <input id="confirm-password-input" type={confirmPasswordVisbility == true ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete={buttonType == "Confirm Reset" ? "new-password" : "current-password"} className="p-2 rounded-md bg-zinc-800 text-white w-full" aria-label="Confirm password" />
                                    <button type="button" className="absolute inset-y-0 end-0 flex items-center z-20 text-zinc-500 p-2 hover:text-zinc-400" onClick={() => setConfirmPasswordVisibility(!confirmPasswordVisbility)} aria-label={confirmPasswordVisbility ? "Hide confirm password" : "Show confirm password"} aria-pressed={confirmPasswordVisbility}>
                                        {confirmPasswordVisbility == true ? (
                                            <EyeOff size={20} />
                                        ) : (
                                            <Eye size={20} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {(buttonType == "Verify" || buttonType == "Confirm Reset") && (
                        <>
                            <div className="w-full">
                                <label htmlFor="code-input" className="text-sm">Confirmation Code</label>
                                <input id="code-input" type="text" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]*" className="mb-4 p-2 rounded-md bg-zinc-800 text-white w-full" aria-label="Confirmation code" />
                            </div>

                        </>
                    )}

                    <button type="button" onClick={handleButton} className="bg-zinc-700 hover:bg-zinc-500 press:bg-zinc-500 text-white font-bold py-2 px-4 m-1 rounded w-full" aria-busy={isLoading}>{isLoading == true ? "..." : buttonType}</button>
                </form>
                <div className="flex flex-row w-full gap-2 p-2 items-center justify-center">

                    {buttonType !== "Reset Password" && buttonType !== "Sign Up" && buttonType !== "Verify" && buttonType !== "Confirm Reset" && (
                        <>
                            <button type="button" className="text-white border-r pr-2 press:underline hover:underline" onClick={() => { setButtonType("Reset Password"); setSysMessage(""); }} aria-label="Navigate to forgot password">Forgot Password</button>
                            <button type="button" className="text-white press:underline hover:underline" onClick={() => { setButtonType("Sign Up"); setSysMessage(""); setPassword(""); setConfirmPassword(""); }} aria-label="Navigate to create new account">Create New Account</button>
                        </>
                    )}

                    {buttonType !== "Sign In" && (
                        <button type="button" className="text-white press:underline hover:underline" onClick={() => { setButtonType("Sign In"); setSysMessage(""); setPassword(""); setConfirmPassword(""); setCode(""); }} aria-label="Return to sign in">Return to Sign In</button>
                    )}
                </div>
                <div className="flex w-full items-center justify-center text-center pb-2" role="status" aria-live="polite" aria-atomic="true">
                    {sysMessage !== "" && (
                        <p className="text-white">{sysMessage}</p>
                    )}
                </div>
            </div>
        </>
    )

}
