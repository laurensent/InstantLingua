import Cocoa
import SwiftUI
import NaturalLanguage
import AVFoundation

// MARK: - App Delegate
class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate {
    var window: NSWindow?
    var eventMonitor: Any?
    private var _handledURL = false
    private let lock = NSLock()
    private var isShowingDialog = false
    private var isTerminating = false

    var handledURL: Bool {
        get { lock.lock(); defer { lock.unlock() }; return _handledURL }
        set { lock.lock(); defer { lock.unlock() }; _handledURL = newValue }
    }

    func applicationWillFinishLaunching(_ notification: Notification) {
        // Register URL handler early to catch URL events before applicationDidFinishLaunching
        NSAppleEventManager.shared().setEventHandler(
            self,
            andSelector: #selector(handleURL(_:withReplyEvent:)),
            forEventClass: AEEventClass(kInternetEventClass),
            andEventID: AEEventID(kAEGetURL)
        )
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Delay to allow URL handler to run first
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
            guard let self = self, !self.handledURL else { return }
            self.showDialog(text: nil)
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        // Always keep running - we terminate explicitly when needed
        return false
    }

    // Handle window close button (red button)
    func windowWillClose(_ notification: Notification) {
        // Only terminate if we're showing a dialog and not already terminating
        if isShowingDialog && !isTerminating {
            closeAndTerminate()
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        // Clean up event monitor
        if let monitor = eventMonitor {
            NSEvent.removeMonitor(monitor)
            eventMonitor = nil
        }
    }

    @objc func handleURL(_ event: NSAppleEventDescriptor, withReplyEvent replyEvent: NSAppleEventDescriptor) {
        handledURL = true

        guard let urlString = event.paramDescriptor(forKeyword: AEKeyword(keyDirectObject))?.stringValue else {
            DispatchQueue.main.async { [weak self] in
                self?.showDialog(text: nil)
            }
            return
        }

        // Parse URL and extract text parameter
        var decodedText: String?
        if let components = URLComponents(string: urlString) {
            // Try base64 encoded parameter first (URL-safe base64)
            if let b64Param = components.queryItems?.first(where: { $0.name == "b64" })?.value {
                // Handle URL-safe base64 (replace - with +, _ with /)
                var base64 = b64Param.replacingOccurrences(of: "-", with: "+")
                                     .replacingOccurrences(of: "_", with: "/")
                // Add padding if needed
                let remainder = base64.count % 4
                if remainder > 0 {
                    base64 += String(repeating: "=", count: 4 - remainder)
                }
                if let data = Data(base64Encoded: base64),
                   let text = String(data: data, encoding: .utf8) {
                    decodedText = text
                }
            }
            // Fall back to regular text parameter
            if decodedText == nil,
               let textParam = components.queryItems?.first(where: { $0.name == "text" })?.value,
               !textParam.isEmpty {
                decodedText = textParam
            }
        }

        // Ensure UI updates happen on main thread
        DispatchQueue.main.async { [weak self] in
            self?.showDialog(text: decodedText)
        }
    }

    func closeAndTerminate() {
        // Prevent recursive calls
        guard !isTerminating else { return }
        isTerminating = true

        // Clean up event monitor first
        if let monitor = eventMonitor {
            NSEvent.removeMonitor(monitor)
            eventMonitor = nil
        }

        // Fade out animation then terminate
        if let window = window {
            NSAnimationContext.runAnimationGroup({ context in
                context.duration = 0.1
                window.animator().alphaValue = 0
            }, completionHandler: {
                NSApplication.shared.terminate(nil)
            })
        } else {
            NSApplication.shared.terminate(nil)
        }
    }

    func showDialog(text: String? = nil) {
        // Reset termination state for new dialog
        isTerminating = false

        // Clean up previous event monitor
        if let monitor = eventMonitor {
            NSEvent.removeMonitor(monitor)
            eventMonitor = nil
        }

        // Use provided text or fall back to clipboard
        let clipboardText: String
        if let text = text, !text.isEmpty {
            clipboardText = text
        } else {
            clipboardText = NSPasteboard.general.string(forType: .string) ?? "No content in clipboard"
        }

        // Hide and release old window without triggering delegate
        isShowingDialog = false
        if let oldWindow = window {
            oldWindow.delegate = nil  // Prevent windowWillClose from being called
            oldWindow.orderOut(nil)   // Hide window
            oldWindow.close()         // Release resources
        }
        window = nil

        let contentView = DialogView(text: clipboardText) { [weak self] in
            self?.closeAndTerminate()
        }

        let lineCount = clipboardText.components(separatedBy: "\n").count
        let charCount = clipboardText.count
        let isBilingual = clipboardText.contains("\n---\n")

        // Better size calculation
        let baseWidth: CGFloat = 440
        let baseHeight: CGFloat = isBilingual ? 280 : 180

        let avgCharsPerLine: CGFloat = 40
        let estimatedLines = ceil(CGFloat(charCount) / avgCharsPerLine) + CGFloat(lineCount)
        let lineHeight: CGFloat = 20
        let padding: CGFloat = isBilingual ? 140 : 100  // Title bar + card header + footer

        let estimatedWidth: CGFloat = min(max(baseWidth, CGFloat(charCount) / 2.5), 600)
        let estimatedHeight: CGFloat = min(max(baseHeight, estimatedLines * lineHeight + padding), 600)

        let panel = NSPanel(
            contentRect: NSRect(x: 0, y: 0, width: estimatedWidth, height: estimatedHeight),
            styleMask: [.titled, .closable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )

        panel.title = "InstantLingua"
        panel.titlebarAppearsTransparent = true
        panel.isMovableByWindowBackground = true
        panel.backgroundColor = .clear
        panel.isOpaque = false
        panel.hasShadow = true
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]

        let visualEffect = NSVisualEffectView()
        visualEffect.blendingMode = .behindWindow
        visualEffect.state = .active
        visualEffect.material = .hudWindow

        let hostingView = NSHostingView(rootView: contentView)
        hostingView.translatesAutoresizingMaskIntoConstraints = false

        visualEffect.addSubview(hostingView)
        NSLayoutConstraint.activate([
            hostingView.topAnchor.constraint(equalTo: visualEffect.topAnchor),
            hostingView.bottomAnchor.constraint(equalTo: visualEffect.bottomAnchor),
            hostingView.leadingAnchor.constraint(equalTo: visualEffect.leadingAnchor),
            hostingView.trailingAnchor.constraint(equalTo: visualEffect.trailingAnchor)
        ])

        panel.contentView = visualEffect
        panel.delegate = self

        // Position near mouse cursor
        let mouseLocation = NSEvent.mouseLocation
        guard let screen = NSScreen.main ?? NSScreen.screens.first else {
            // Fallback: center on screen if no screen available
            panel.center()
            panel.makeKeyAndOrderFront(nil)
            window = panel
            NSApplication.shared.activate(ignoringOtherApps: true)
            return
        }
        let screenFrame = screen.visibleFrame
        var windowX = mouseLocation.x - estimatedWidth / 2

        // Default: above mouse, fallback: below if near top edge
        let spaceAbove = screenFrame.maxY - mouseLocation.y
        var windowY: CGFloat
        if spaceAbove >= estimatedHeight + 30 {
            // Enough space above - place window above mouse
            windowY = mouseLocation.y + 20
        } else {
            // Not enough space above - place below mouse
            windowY = mouseLocation.y - estimatedHeight - 20
        }

        // Keep window within screen bounds
        windowX = max(screenFrame.minX + 10, min(windowX, screenFrame.maxX - estimatedWidth - 10))
        windowY = max(screenFrame.minY + 10, min(windowY, screenFrame.maxY - estimatedHeight - 10))

        panel.setFrameOrigin(NSPoint(x: windowX, y: windowY))

        // Fade in animation
        panel.alphaValue = 0
        panel.makeKeyAndOrderFront(nil)
        NSAnimationContext.runAnimationGroup { context in
            context.duration = 0.08
            panel.animator().alphaValue = 1
        }

        window = panel
        isShowingDialog = true

        NSApplication.shared.activate(ignoringOtherApps: true)

        // Keyboard shortcuts
        eventMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            guard let self = self else { return event }
            // Escape to close
            if event.keyCode == 53 {
                self.closeAndTerminate()
                return nil
            }
            // Cmd+C to copy translation
            if event.modifierFlags.contains(.command) && event.charactersIgnoringModifiers == "c" {
                let parts = clipboardText.components(separatedBy: "\n---\n")
                let textToCopy = parts.count >= 2 ? parts[1] : clipboardText
                NSPasteboard.general.clearContents()
                NSPasteboard.general.setString(textToCopy, forType: .string)
                NSHapticFeedbackManager.defaultPerformer.perform(.generic, performanceTime: .default)
                return nil
            }
            return event
        }
    }
}

// MARK: - Language Detection
func detectLanguage(_ text: String) -> String {
    let recognizer = NLLanguageRecognizer()
    recognizer.processString(text)

    guard let language = recognizer.dominantLanguage else { return "Text" }

    // Check confidence - if too low, return generic label
    let hypotheses = recognizer.languageHypotheses(withMaximum: 1)
    if let confidence = hypotheses[language], confidence < 0.5 {
        return "Text"
    }

    let languageNames: [NLLanguage: String] = [
        .english: "English",
        .simplifiedChinese: "Chinese",
        .traditionalChinese: "Chinese",
        .japanese: "Japanese",
        .korean: "Korean",
        .french: "French",
        .german: "German",
        .spanish: "Spanish",
        .portuguese: "Portuguese",
        .italian: "Italian",
        .russian: "Russian",
        .arabic: "Arabic",
        .hindi: "Hindi",
        .thai: "Thai",
        .vietnamese: "Vietnamese",
        .dutch: "Dutch",
        .swedish: "Swedish",
        .polish: "Polish",
        .turkish: "Turkish",
        .indonesian: "Indonesian",
        .malay: "Malay",
        .czech: "Czech",
        .danish: "Danish",
        .finnish: "Finnish",
        .greek: "Greek",
        .hebrew: "Hebrew",
        .hungarian: "Hungarian",
        .norwegian: "Norwegian",
        .romanian: "Romanian",
        .slovak: "Slovak",
        .ukrainian: "Ukrainian",
        .catalan: "Catalan",
        .croatian: "Croatian",
        .bulgarian: "Bulgarian"
    ]

    return languageNames[language] ?? "Text"
}

// MARK: - Speech Manager
class SpeechManager: NSObject, ObservableObject, AVSpeechSynthesizerDelegate {
    @Published var speakingOriginal = false
    @Published var speakingTranslation = false

    private let synthesizer = AVSpeechSynthesizer()

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    deinit {
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
    }

    func speak(_ text: String, isOriginal: Bool) {
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
            speakingOriginal = false
            speakingTranslation = false
            return
        }

        if isOriginal {
            speakingOriginal = true
        } else {
            speakingTranslation = true
        }

        let utterance = AVSpeechUtterance(string: text)
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate
        synthesizer.speak(utterance)
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        DispatchQueue.main.async { [weak self] in
            self?.speakingOriginal = false
            self?.speakingTranslation = false
        }
    }
}

// MARK: - Dialog View
struct DialogView: View {
    let text: String
    let onClose: () -> Void
    @State private var copiedOriginal = false
    @State private var copiedTranslation = false
    @State private var showingHelp = false
    @StateObject private var speechManager = SpeechManager()
    @Environment(\.colorScheme) private var colorScheme

    // Adaptive opacity based on color scheme
    private var originalCardOpacity: Double {
        colorScheme == .dark ? 0.15 : 0.06
    }

    private var translationCardOpacity: Double {
        colorScheme == .dark ? 0.20 : 0.10
    }

    private var isBilingual: Bool {
        text.contains("\n---\n")
    }

    private var bilingualParts: (original: String, translation: String)? {
        guard isBilingual else { return nil }
        let parts = text.components(separatedBy: "\n---\n")
        guard parts.count >= 2 else { return nil }
        return (parts[0], parts[1])
    }

    private var languageLabels: (from: String, to: String) {
        guard let parts = bilingualParts else { return ("Original", "Translation") }
        let fromLang = detectLanguage(parts.original)
        let toLang = detectLanguage(parts.translation)
        return (fromLang, toLang)
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                if let parts = bilingualParts {
                    // Bilingual layout
                    VStack(alignment: .leading, spacing: 12) {
                        // Original text
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(languageLabels.from)
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundStyle(.secondary)
                                Spacer()
                                HStack(spacing: 12) {
                                    Button(action: { speechManager.speak(parts.original, isOriginal: true) }) {
                                        Image(systemName: speechManager.speakingOriginal ? "stop.fill" : "speaker.wave.2")
                                            .font(.system(size: 12))
                                            .foregroundStyle(speechManager.speakingOriginal ? .orange : .secondary)
                                            .frame(width: 14, height: 14)
                                    }
                                    .buttonStyle(.plain)
                                    Button(action: { copyText(parts.original) }) {
                                        Image(systemName: copiedOriginal ? "checkmark" : "doc.on.doc")
                                            .font(.system(size: 11))
                                            .foregroundStyle(copiedOriginal ? .green : .secondary)
                                            .frame(width: 14, height: 14)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            Text(parts.original)
                                .font(.system(size: 14))
                                .lineSpacing(4)
                                .textSelection(.enabled)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(12)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.primary.opacity(originalCardOpacity))
                        )

                        // Translation
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Text(languageLabels.to)
                                    .font(.system(size: 11, weight: .medium))
                                    .foregroundStyle(.secondary)
                                Spacer()
                                HStack(spacing: 12) {
                                    Button(action: { speechManager.speak(parts.translation, isOriginal: false) }) {
                                        Image(systemName: speechManager.speakingTranslation ? "stop.fill" : "speaker.wave.2")
                                            .font(.system(size: 12))
                                            .foregroundStyle(speechManager.speakingTranslation ? .orange : .secondary)
                                            .frame(width: 14, height: 14)
                                    }
                                    .buttonStyle(.plain)
                                    Button(action: { copyText(parts.translation, isTranslation: true) }) {
                                        Image(systemName: copiedTranslation ? "checkmark" : "doc.on.doc")
                                            .font(.system(size: 11))
                                            .foregroundStyle(copiedTranslation ? .green : .secondary)
                                            .frame(width: 14, height: 14)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            Text(parts.translation)
                                .font(.system(size: 14))
                                .lineSpacing(4)
                                .textSelection(.enabled)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(12)
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(Color.accentColor.opacity(translationCardOpacity))
                        )
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 20)
                    .padding(.bottom, 8)
                } else {
                    // Single text layout
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Text(detectLanguage(text))
                                .font(.system(size: 11, weight: .medium))
                                .foregroundStyle(.secondary)
                            Spacer()
                            HStack(spacing: 12) {
                                Button(action: { speechManager.speak(text, isOriginal: true) }) {
                                    Image(systemName: speechManager.speakingOriginal ? "stop.fill" : "speaker.wave.2")
                                        .font(.system(size: 12))
                                        .foregroundStyle(speechManager.speakingOriginal ? .orange : .secondary)
                                        .frame(width: 14, height: 14)
                                }
                                .buttonStyle(.plain)
                                Button(action: { copyText(text) }) {
                                    Image(systemName: copiedOriginal ? "checkmark" : "doc.on.doc")
                                        .font(.system(size: 11))
                                        .foregroundStyle(copiedOriginal ? .green : .secondary)
                                        .frame(width: 14, height: 14)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        Text(text)
                            .font(.system(size: 14))
                            .lineSpacing(4)
                            .textSelection(.enabled)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .padding(12)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.primary.opacity(originalCardOpacity))
                    )
                    .padding(.horizontal, 16)
                    .padding(.top, 20)
                    .padding(.bottom, 8)
                }
            }
            .frame(maxHeight: .infinity)

            Divider()
                .opacity(0.3)

            // Footer
            HStack {
                Text("\(text.count) characters")
                    .font(.system(size: 11))
                    .foregroundStyle(.tertiary)

                Spacer()

                Button(action: { showingHelp.toggle() }) {
                    Image(systemName: "questionmark.circle")
                        .font(.system(size: 14))
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.plain)
                .popover(isPresented: $showingHelp, arrowEdge: .top) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Keyboard Shortcuts")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(.primary)
                        Divider()
                        HStack {
                            Text("Esc")
                                .font(.system(size: 11, weight: .medium, design: .monospaced))
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.primary.opacity(0.1))
                                .cornerRadius(4)
                            Text("Close")
                                .font(.system(size: 11))
                                .foregroundStyle(.secondary)
                        }
                        HStack {
                            Text("Return")
                                .font(.system(size: 11, weight: .medium, design: .monospaced))
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.primary.opacity(0.1))
                                .cornerRadius(4)
                            Text("Done")
                                .font(.system(size: 11))
                                .foregroundStyle(.secondary)
                        }
                        HStack {
                            Text("Cmd+C")
                                .font(.system(size: 11, weight: .medium, design: .monospaced))
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.primary.opacity(0.1))
                                .cornerRadius(4)
                            Text("Copy translation")
                                .font(.system(size: 11))
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding(12)
                }

                Button("Done") {
                    onClose()
                }
                .buttonStyle(.borderedProminent)
                .keyboardShortcut(.return, modifiers: [])
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .frame(minWidth: 360, minHeight: 160)
    }

    private func copyText(_ text: String, isTranslation: Bool = false) {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(text, forType: .string)
        if isTranslation {
            copiedTranslation = true
        } else {
            copiedOriginal = true
        }
        NSHapticFeedbackManager.defaultPerformer.perform(.generic, performanceTime: .default)
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            if isTranslation {
                copiedTranslation = false
            } else {
                copiedOriginal = false
            }
        }
    }
}

// MARK: - Main
let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()