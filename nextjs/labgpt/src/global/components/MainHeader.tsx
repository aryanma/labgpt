export default function MainHeader() {


    return (
        <header className="App-header">
            <h1>LabGPT</h1>
            <div className="header-actions">
                <span className="header-subtitle">Your AI-powered research assistant</span>
                {/* {currentWorkspace && (
                    <div className="current-workspace">
                        <span>Workspace: {currentWorkspace.name}</span>
                    </div>
                )} */}
            </div>
        </header>
    );
}