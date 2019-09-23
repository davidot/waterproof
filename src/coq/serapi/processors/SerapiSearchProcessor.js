import SerapiProcessor from '../util/SerapiProcessor';
import {Mutex} from 'async-mutex';
import {
  createCheckCommand,
  createSearchCommand,
} from '../util/SerapiCommandFactory';

class SerapiSearchProcessor extends SerapiProcessor {
  /**
   *
   * @param {SerapiTagger} tagger
   * @param {SerapiState} state
   * @param {EditorInterface} editor
   */
  constructor(tagger, state, editor) {
    super(tagger, state, editor);

    this.currentSearch = 0;
    this.searchNumLock = new Mutex();
  }


  async searchFor(query, onResult, onDone) {
    const searchNum = await this._startNewSearch();
    await this._checkQuery(query);
    if (!await this._continueSearch(searchNum)) {
      return;
    }

    await this._searchQuery(query);
    if (!await this._continueSearch(searchNum)) {
      return;
    }

    await this._searchStringQuery(query);

    // TODO: should we really check here?
    if (!await this._continueSearch(searchNum)) {
      return;
    }

    onDone();
    return Promise.resolve();
  }

  async _startNewSearch() {
    const release = await this.searchNumLock.acquire();
    if (this.currentSearch > 100000) {
      this.currentSearch = -1;
    }
    const newSearch = ++this.currentSearch;
    release();
    return newSearch;
  }

  async _continueSearch(searchNumber) {
    const release = await this.searchNumLock.acquire();
    const stillCurrent = this.currentSearch === searchNumber;
    release();
    return stillCurrent;
  }

  async _checkQuery(query) {
    return this.sendCommand(createCheckCommand(query), 'c');
  }

  async _searchQuery(query) {
    return this.sendCommand(createSearchCommand('(' + query + ')'), 'q');
  }

  async _searchStringQuery(query) {
    return this.sendCommand(createSearchCommand('"' + query + '"'), 't');
  }

  handleSerapiMessage(data, extraTag) {
    console.log(extraTag +'-message:' + data);
  }

  handleFeedback(data, extraTag) {
    console.log('feedback:' + data);
  }
}


export default SerapiSearchProcessor;
